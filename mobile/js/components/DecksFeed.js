import React from 'react';
import {
  ActivityIndicator,
  Animated,
  InteractionManager,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { CardCell } from './CardCell';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { PlayDeckActions } from '../play/PlayDeckActions';
import { PlayDeckNavigator } from '../play/PlayDeckNavigator';
import { useSafeArea } from 'react-native-safe-area-context';
import { useListen } from '../ghost/GhostEvents';

import tinycolor from 'tinycolor2';
import Viewport from '../common/viewport';

import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';

const { vw, vh } = Viewport;

const FEED_HEADER_HEIGHT = 56;

// if the screen is too stubby, add horizontal padding to the feed
// such that the aspect-fit cards are 87% of the screen height
const STUBBY_SCREEN_ITEM_HORIZ_PADDING = Viewport.isCardWide
  ? 0
  : (87 * vh * Constants.CARD_RATIO - 100 * vw) / -2;

const DECK_FEED_ITEM_MARGIN = 24;
const DECK_FEED_ITEM_HEIGHT =
  (1 / Constants.CARD_RATIO) * (100 * vw - STUBBY_SCREEN_ITEM_HORIZ_PADDING * 2) + // height of card
  DECK_FEED_ITEM_MARGIN; // margin below cell

const FLIP_MIN_TRANSLATE_Y = DECK_FEED_ITEM_HEIGHT * 0.35;
const FLIP_MIN_VELOCITY_Y = 72;

const SPRING_CONFIG = {
  tension: 150,
  friction: 50,
  useNativeDriver: true,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
    borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
  },
  loadingIndicator: {
    position: 'absolute',
    top: FEED_HEADER_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    minHeight: 64,
  },
  itemContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: DECK_FEED_ITEM_MARGIN,
  },
  itemCard: {
    aspectRatio: Constants.CARD_RATIO,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemHeader: {
    position: 'absolute',
    width: '100%',
    height: 48,
    top: 0,
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});

const makeCardAspectFitStyles = () => {
  if (Viewport.isCardWide) {
    return styles.itemContainer;
  }
  return [
    styles.itemContainer,
    {
      paddingHorizontal: STUBBY_SCREEN_ITEM_HORIZ_PADDING,
    },
  ];
};

const cardAspectFitStyles = makeCardAspectFitStyles();

const makeBackgroundColor = (card) => {
  let baseColor, backgroundColor;
  if (card?.backgroundImage?.primaryColor) {
    baseColor = card.backgroundImage.primaryColor;
  } else {
    baseColor = '#333';
  }
  let base = tinycolor(baseColor);
  if (tinycolor(baseColor).isLight()) {
    backgroundColor = base.darken(20).toString();
  } else {
    backgroundColor = base.darken().toString();
  }
  return backgroundColor;
};

// renders the current focused deck in the feed
const CurrentDeckCell = ({
  deck,
  isPlaying,
  onPressDeck,
  playingTransition,
  previewVideoPaused,
}) => {
  const initialCard = deck?.initialCard;
  const insets = useSafeArea();

  if (!initialCard) return null;

  // TODO:
  // animate containerStyles (height and horiz padding)
  // line up top of card cell between states (not just center)

  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let timeout;
    const task = InteractionManager.runAfterInteractions(() => {
      if (deck && isPlaying) {
        timeout = setTimeout(() => {
          setReady(true);
        }, 10);
      } else {
        setReady(false);
      }
    });
    return () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      setReady(false);
      task.cancel();
    };
  }, [deck, isPlaying]);

  const onSelectPlay = () => onPressDeck({ deckId: deck.deckId });
  const onPressBack = () => onPressDeck({ deckId: undefined });
  const backgroundColor = makeBackgroundColor(initialCard);

  if (Constants.Android) {
    // after the game loads, it listens for keyboard events and
    // causes react native's back button event to fail
    useListen({
      eventName: 'CASTLE_SYSTEM_BACK_BUTTON',
      handler: onPressBack,
    });
  }

  // when playing, move the header and footer to the screen edges
  const playingHeaderY = playingTransition.interpolate({
    inputRange: [0, 1.01],
    outputRange: [0, -(insets.top + FEED_HEADER_HEIGHT)],
  });

  return (
    <View style={[cardAspectFitStyles, { overflow: 'visible', marginBottom: 0 }]}>
      <View style={styles.itemCard}>
        <CardCell
          card={initialCard}
          previewVideo={deck?.previewVideo}
          onPress={onSelectPlay}
          previewVideoPaused={previewVideoPaused}
        />
        {ready ? (
          <View style={styles.absoluteFill}>
            <PlayDeckNavigator
              deckId={deck.deckId}
              initialCardId={deck.initialCard && deck.initialCard.cardId}
              initialDeckState={Utilities.makeInitialDeckState(deck)}
            />
          </View>
        ) : null}
      </View>
      <Animated.View style={[styles.itemHeader, { transform: [{ translateY: playingHeaderY }] }]}>
        <PlayDeckActions
          deck={deck}
          isPlaying={isPlaying}
          onPressBack={onPressBack}
          backgroundColor={makeBackgroundColor(deck.initialCard)}
        />
      </Animated.View>
    </View>
  );
};

// TODO: BEN: taken from PlayDeckScreen
/*
      
  // reset index into decks if decks changes
  React.useEffect(() => setDeckIndex(Math.min(initialDeckIndex, decks.length - 1)), [
    decks?.length,
    initialDeckIndex,
  ]);

*/

/**
 The following props mimic RN's FlatList API:
 refreshing, onRefresh, onEndReached, onEndReachedThreshold
 */
export const DecksFeed = ({
  decks,
  isPlaying,
  onPressDeck,
  refreshing,
  onRefresh,
  onEndReached,
  onEndReachedThreshold,
}) => {
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  const insets = useSafeArea();
  let centerContentY = insets.top + FEED_HEADER_HEIGHT;

  // state from scrolling the feed up and down
  let translateY = React.useRef(new Animated.Value(0)).current;

  // refresh control
  let refreshOverscrollY = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    let toValue = refreshing ? 64 : 0;
    // only do the spinner animation if we're at the top of the feed
    // (we might refresh from the middle of the feed if we're appending to infinite scroll)
    if ((refreshing && currentCardIndex == 0) || !refreshing) {
      Animated.spring(refreshOverscrollY, { toValue, ...SPRING_CONFIG }).start();
    }
  }, [refreshing, currentCardIndex]);

  let containerY = Animated.add(translateY, centerContentY - DECK_FEED_ITEM_HEIGHT);
  containerY = Animated.add(containerY, refreshOverscrollY);
  const onPanGestureEvent = Animated.event([{ nativeEvent: { translationY: translateY } }], {
    useNativeDriver: true,
  });

  // state from expanding/collapsing a deck to play it
  // note: non-native duplicate is needed for just the background color fade (not supported by native)
  const startingPosition = isPlaying === true ? 1.01 : 0;
  const playingTransition = React.useRef(new Animated.Value(startingPosition)).current;
  const playingTransitionNonNative = React.useRef(new Animated.Value(0)).current;
  const playingOffsetPrevY = playingTransition.interpolate({
    inputRange: [0, 1.01],
    outputRange: [0, -150],
  });
  const playingOffsetNextY = playingTransition.interpolate({
    inputRange: [0, 1.01],
    outputRange: [DECK_FEED_ITEM_MARGIN, 150],
  });
  const backgroundColor = makeBackgroundColor(decks ? decks[currentCardIndex]?.initialCard : null);
  const playingBackgroundColor = playingTransitionNonNative.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 1)', tinycolor(backgroundColor).toRgbString()],
  });

  React.useEffect(() => {
    Animated.spring(playingTransition, { toValue: isPlaying ? 1.01 : 0, ...SPRING_CONFIG }).start();
    Animated.spring(playingTransitionNonNative, {
      toValue: isPlaying ? 1.01 : 0,
      ...SPRING_CONFIG,
      useNativeDriver: false,
    }).start();
  }, [isPlaying]);

  const snapTo = React.useCallback(
    (toValue, futureCardIndex = null) => {
      Animated.spring(translateY, {
        toValue,
        ...SPRING_CONFIG,
      }).start(({ finished }) => {
        if (finished) {
          setPaused(false);
          if (futureCardIndex !== null) {
            setCurrentCardIndex(futureCardIndex);
            translateY.setValue(0);

            const endReachedProgress = decks.length > 0 ? futureCardIndex / decks.length : 0;
            const distanceFromEnd = 1 - endReachedProgress;
            if (onEndReached && distanceFromEnd < onEndReachedThreshold) {
              onEndReached({ distanceFromEnd });
            }
          } else {
            translateY.setValue(0);
          }
        }
      });
    },
    [translateY, currentCardIndex, onEndReached, onEndReachedThreshold, decks?.length]
  );

  const snapToNext = React.useCallback(() => {
    if (decks && currentCardIndex < decks.length - 1) {
      snapTo(-DECK_FEED_ITEM_HEIGHT, currentCardIndex + 1);
    } else {
      snapTo(0);
    }
  }, [decks, currentCardIndex, snapTo]);

  const snapToPrevious = React.useCallback(() => {
    if (currentCardIndex > 0) {
      snapTo(DECK_FEED_ITEM_HEIGHT, currentCardIndex - 1);
    } else {
      // overscroll beyond top of feed
      snapTo(0);
      onRefresh();
    }
  }, [currentCardIndex, snapTo, onRefresh]);

  const onPanStateChange = React.useCallback(
    (event) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        const { translationY, velocityY } = event.nativeEvent;
        if (translationY < -FLIP_MIN_TRANSLATE_Y || velocityY < -FLIP_MIN_VELOCITY_Y) {
          snapToNext();
        } else if (translationY > FLIP_MIN_TRANSLATE_Y || velocityY > FLIP_MIN_VELOCITY_Y) {
          snapToPrevious();
        } else {
          snapTo(0);
        }
      }
      if (event.nativeEvent.state === State.BEGAN) {
        setPaused(true);
      }
    },
    [snapTo, snapToNext, snapToPrevious]
  );

  if (!decks) {
    return <View style={styles.container} />;
  }

  // The edges of prevPrev/nextNext cards are shown briefly during the snap animation
  const currentDeck = decks[currentCardIndex];
  const prevPrevDeck = currentCardIndex > -1 ? decks[currentCardIndex - 2] : null;
  const prevDeck = currentCardIndex > 0 ? decks[currentCardIndex - 1] : null;
  const nextDeck = currentCardIndex < decks.length - 1 ? decks[currentCardIndex + 1] : null;
  const nextNextDeck = currentCardIndex < decks.length - 2 ? decks[currentCardIndex + 2] : null;

  if (prevPrevDeck) {
    containerY = Animated.add(containerY, -DECK_FEED_ITEM_HEIGHT);
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: playingBackgroundColor }]}>
      {refreshing ? (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="large" color={Constants.iOS ? '#fff' : undefined} />
        </View>
      ) : null}
      <PanGestureHandler
        minDist={8}
        enabled={!isPlaying}
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanStateChange}>
        <Animated.View style={{ transform: [{ translateY: containerY }] }}>
          <Animated.View style={{ transform: [{ translateY: playingOffsetPrevY }] }}>
            {prevPrevDeck && (
              <View style={cardAspectFitStyles}>
                <View style={styles.itemCard}>
                  <CardCell card={prevPrevDeck.initialCard} />
                </View>
              </View>
            )}
            <View style={cardAspectFitStyles}>
              <View style={styles.itemCard}>
                {prevDeck ? <CardCell card={prevDeck.initialCard} /> : null}
              </View>
              {prevDeck ? (
                <View style={styles.itemHeader}>
                  <PlayDeckActions
                    deck={prevDeck}
                    disabled={true}
                    backgroundColor={makeBackgroundColor(prevDeck.initialCard)}
                  />
                </View>
              ) : null}
            </View>
          </Animated.View>
          <CurrentDeckCell
            deck={currentDeck}
            isPlaying={isPlaying}
            onPressDeck={onPressDeck}
            playingTransition={playingTransition}
            previewVideoPaused={paused}
          />
          <Animated.View style={{ transform: [{ translateY: playingOffsetNextY }] }}>
            <View style={cardAspectFitStyles}>
              <View style={styles.itemCard}>
                {nextDeck ? <CardCell card={nextDeck.initialCard} /> : null}
              </View>
              {nextDeck ? (
                <View style={styles.itemHeader}>
                  <PlayDeckActions
                    deck={nextDeck}
                    disabled={true}
                    backgroundColor={makeBackgroundColor(nextDeck.initialCard)}
                  />
                </View>
              ) : null}
            </View>
            {nextNextDeck && (
              <View style={cardAspectFitStyles}>
                <View style={styles.itemCard}>
                  <CardCell card={nextNextDeck.initialCard} />
                </View>
                <View style={styles.itemHeader}>
                  <PlayDeckActions
                    deck={nextNextDeck}
                    disabled={true}
                    backgroundColor={makeBackgroundColor(nextNextDeck.initialCard)}
                  />
                </View>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};
