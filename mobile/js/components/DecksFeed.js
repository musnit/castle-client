import React from 'react';
import {
  ActivityIndicator,
  Animated,
  InteractionManager,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { CardCell } from './CardCell';
import { useSafeArea, SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { PlayDeckActions } from '../play/PlayDeckActions';
import { PlayDeckNavigator } from '../play/PlayDeckNavigator';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';

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

const DECK_FEED_ITEM_MARGIN = 48;
const DECK_FEED_ITEM_HEIGHT =
  (1 / Constants.CARD_RATIO) * (100 * vw - STUBBY_SCREEN_ITEM_HORIZ_PADDING * 2) + // height of card
  DECK_FEED_ITEM_MARGIN; // margin below cell

const FLIP_MIN_TRANSLATE_Y = DECK_FEED_ITEM_HEIGHT * 0.35;
const FLIP_MIN_VELOCITY_Y = 72;

const SPRING_CONFIG = {
  tension: 150,
  friction: 50,
  overshootClamping: true,
  restDisplacementThreshold: 1,
  restSpeedThreshold: 1,
  useNativeDriver: true,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
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
    borderRadius: 6,
  },
  itemHeader: {
    position: 'absolute',
    width: '100%',
    height: 48,
    top: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  itemFooter: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    height: 16,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
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

const makeCardColors = (card) => {
  let baseColor, headerColor, backgroundColor;
  if (card?.backgroundImage?.primaryColor) {
    baseColor = card.backgroundImage.primaryColor;
  } else {
    baseColor = '#333';
  }
  let base = tinycolor(baseColor);
  if (tinycolor(baseColor).isLight()) {
    headerColor = base.darken().toString();
    backgroundColor = base.lighten().toString();
  } else {
    headerColor = base.lighten().toString();
    backgroundColor = base.darken().toString();
  }
  return {
    backgroundColor,
    headerColor,
  };
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
  const { headerColor, backgroundColor } = makeCardColors(initialCard);

  // when playing, move the header and footer to the screen edges
  const playingHeaderY = playingTransition.interpolate({
    inputRange: [0, 1.01],
    outputRange: [0, -(insets.top + FEED_HEADER_HEIGHT)],
  });
  const playingFooterY = playingTransition.interpolate({
    inputRange: [0, 1.01],
    outputRange: [
      0,
      vh * 100 - DECK_FEED_ITEM_HEIGHT + DECK_FEED_ITEM_MARGIN - insets.top - FEED_HEADER_HEIGHT,
    ],
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
      <Animated.View
        style={[
          styles.itemHeader,
          { backgroundColor: headerColor, transform: [{ translateY: playingHeaderY }] },
        ]}>
        <PlayDeckActions deck={deck} isPlaying={isPlaying} onPressBack={onPressBack} />
      </Animated.View>
      <Animated.View
        style={[
          styles.itemFooter,
          { backgroundColor: headerColor, transform: [{ translateY: playingFooterY }] },
        ]}
      />
    </View>
  );
};

export const DecksFeed = ({ decks, isPlaying, onPressDeck, refreshing, onRefresh }) => {
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  const insets = useSafeArea();
  let centerContentY = insets.top + FEED_HEADER_HEIGHT;

  // state from scrolling the feed up and down
  let translateY = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    setCurrentCardIndex(0);
    translateY.setValue(0);
  }, [decks]);

  // refresh control
  let refreshOverscrollY = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    let toValue = refreshing ? 64 : 0;
    Animated.spring(refreshOverscrollY, { toValue, ...SPRING_CONFIG }).start();
  }, [refreshing]);

  let containerY = Animated.add(translateY, centerContentY - DECK_FEED_ITEM_HEIGHT);
  containerY = Animated.add(containerY, refreshOverscrollY);
  const onPanGestureEvent = Animated.event([{ nativeEvent: { translationY: translateY } }], {
    useNativeDriver: true,
  });

  React.useEffect(() => {
    onPressDeck({ deckId: undefined }); // clear play state
    // don't reset translateY here, do it when setting currentCardIndex
  }, [currentCardIndex]);

  // state from expanding/collapsing a deck to play it
  // note: non-native duplicate is needed for just the background color fade (not supported by native)
  const playingTransition = React.useRef(new Animated.Value(0)).current;
  const playingTransitionNonNative = React.useRef(new Animated.Value(0)).current;
  const playingOffsetPrevY = playingTransition.interpolate({
    inputRange: [0, 1.01],
    outputRange: [0, -250],
  });
  const playingOffsetNextY = playingTransition.interpolate({
    inputRange: [0, 1.01],
    outputRange: [DECK_FEED_ITEM_MARGIN, 250],
  });
  const { backgroundColor } = makeCardColors(decks ? decks[currentCardIndex]?.initialCard : null);
  const playingBackgroundColor = playingTransitionNonNative.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: ['rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 1)', tinycolor(backgroundColor).toRgbString()],
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
      Animated.spring(translateY, { toValue, ...SPRING_CONFIG }).start(({ finished }) => {
        if (finished) {
          setPaused(false);
          if (futureCardIndex !== null) {
            setCurrentCardIndex(futureCardIndex);
            translateY.setValue(0);
          } else {
            translateY.setValue(0);
          }
        }
      });
    },
    [translateY, currentCardIndex]
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

  const currentDeck = decks[currentCardIndex];
  const prevCard = currentCardIndex > 0 ? decks[currentCardIndex - 1].initialCard : null;
  const nextCard =
    currentCardIndex < decks.length - 1 ? decks[currentCardIndex + 1].initialCard : null;

  // the edge of the 'next-next' card is shown briefly during the snap animation
  // before the swap occurs.
  const nextNextCard =
    currentCardIndex < decks.length - 2 ? decks[currentCardIndex + 2].initialCard : null;

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
          <Animated.View
            style={[cardAspectFitStyles, { transform: [{ translateY: playingOffsetPrevY }] }]}>
            <View style={styles.itemCard}>{prevCard && <CardCell card={prevCard} />}</View>
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
              <TouchableWithoutFeedback onPress={snapToNext}>
                <View style={styles.itemCard}>{nextCard && <CardCell card={nextCard} />}</View>
              </TouchableWithoutFeedback>
            </View>
            {nextNextCard && (
              <View style={cardAspectFitStyles}>
                <View style={styles.itemCard}>
                  <CardCell card={nextNextCard} />
                </View>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};
