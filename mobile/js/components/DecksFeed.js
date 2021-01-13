import React from 'react';
import { Animated, FlatList, InteractionManager, StyleSheet, View } from 'react-native';
import { CardCell } from './CardCell';
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

const STUBBY_SCREEN_ITEM_HORIZ_PADDING = Viewport.useSmallFeedItem ? 0 : 16;

const DECK_FEED_ITEM_MARGIN = 24;
const DECK_FEED_ITEM_HEIGHT =
  (1 / Constants.CARD_RATIO) * (100 * vw - STUBBY_SCREEN_ITEM_HORIZ_PADDING * 2) + // height of card
  DECK_FEED_ITEM_MARGIN; // margin below cell

const SPRING_CONFIG = {
  tension: 100,
  friction: 50,
  overshootClamping: true,
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
    height: 52,
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
  if (Viewport.useSmallFeedItem) {
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
    <View
      style={[
        cardAspectFitStyles,
        {
          overflow: 'visible',
          paddingHorizontal: isPlaying ? 0 : STUBBY_SCREEN_ITEM_HORIZ_PADDING,
        },
      ]}>
      <View style={styles.itemCard}>
        <CardCell
          card={initialCard}
          previewVideo={deck?.previewVideo}
          onPress={onSelectPlay}
          previewVideoPaused={previewVideoPaused || ready}
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
export const DecksFeed = ({ decks, isPlaying, onPressDeck, ...props }) => {
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  const insets = useSafeArea();
  let centerContentY = insets.top + FEED_HEADER_HEIGHT - 1;

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
    outputRange: [0, 150],
  });
  const backgroundColor = makeBackgroundColor(decks ? decks[currentCardIndex]?.initialCard : null);
  const playingBackgroundColor = playingTransitionNonNative.interpolate({
    inputRange: [0, 0.6, 1.01],
    outputRange: [
      'rgba(0, 0, 0, 1)',
      tinycolor(backgroundColor).toRgbString(),
      tinycolor(backgroundColor).toRgbString(),
    ],
  });

  React.useEffect(() => {
    Animated.spring(playingTransition, { toValue: isPlaying ? 1.01 : 0, ...SPRING_CONFIG }).start();
    Animated.spring(playingTransitionNonNative, {
      toValue: isPlaying ? 1.01 : 0,
      ...SPRING_CONFIG,
      useNativeDriver: false,
    }).start();
  }, [isPlaying]);

  const renderItem = React.useCallback(
    ({ item, index }) => {
      const deck = item;
      if (index === currentCardIndex) {
        return (
          <CurrentDeckCell
            deck={deck}
            isPlaying={isPlaying}
            onPressDeck={onPressDeck}
            playingTransition={playingTransition}
            previewVideoPaused={paused}
          />
        );
      } else {
        let translateStyles;
        if (index === currentCardIndex - 1) {
          translateStyles = { transform: [{ translateY: playingOffsetPrevY }] };
        } else if (index === currentCardIndex + 1) {
          translateStyles = { transform: [{ translateY: playingOffsetNextY }] };
        }
        return (
          <Animated.View style={[cardAspectFitStyles, translateStyles]}>
            <View style={styles.itemCard}>
              {deck ? (
                <CardCell
                  card={deck.initialCard}
                  previewVideo={deck?.previewVideo}
                  previewVideoPaused
                />
              ) : null}
            </View>
            {deck ? (
              <View style={styles.itemHeader}>
                <PlayDeckActions
                  deck={deck}
                  disabled={true}
                  backgroundColor={makeBackgroundColor(deck.initialCard)}
                />
              </View>
            ) : null}
          </Animated.View>
        );
      }
    },
    [currentCardIndex, isPlaying, paused]
  );

  const viewabilityConfig = React.useRef({ itemVisiblePercentThreshold: 90 }).current;
  const onViewableItemsChanged = React.useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentCardIndex(viewableItems[0].index);
    }
  }, []);

  const onScrollBeginDrag = React.useCallback(() => setPaused(true), []);
  const onScrollEndDrag = React.useCallback(() => setPaused(false), []);

  return (
    <Animated.View style={[styles.container, { backgroundColor: playingBackgroundColor }]}>
      <FlatList
        {...props}
        data={decks}
        contentContainerStyle={{ paddingTop: centerContentY }}
        renderItem={renderItem}
        initialNumToRender={3}
        keyExtractor={(item, index) => `${item?.deckId}-${index}`}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isPlaying}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        snapToAlignment="start"
        snapToInterval={DECK_FEED_ITEM_HEIGHT}
        decelerationRate="fast"
        pagingEnabled
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
      />
    </Animated.View>
  );
};
