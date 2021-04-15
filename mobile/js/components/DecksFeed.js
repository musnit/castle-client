import React from 'react';
import {
  Animated,
  BackHandler,
  FlatList,
  InteractionManager,
  StyleSheet,
  View,
} from 'react-native';
import { CardCell } from './CardCell';
import { PlayDeckActions, PlayDeckActionsSkeleton } from '../play/PlayDeckActions';
import { PlayDeckNavigator } from '../play/PlayDeckNavigator';
import { useIsFocused, useFocusEffect } from '../ReactNavigation';
import { useListen } from '../ghost/GhostEvents';
import { useSession, blockUser, reportDeck } from '../Session';

import debounce from 'lodash.debounce';
import Viewport from '../common/viewport';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';

const { vw, vh } = Viewport;

const DECK_FEED_ITEM_MARGIN = 24;

// Determines how much horizontal padding to add to each card to ensure proper spacing.
// Design goal is for the selected card to be entirely visible as well as the top
// half of the next card's header.
const getItemHorzPadding = ({ isPlaying = false } = {}) => {
  const availHeight = isPlaying
    ? vh * 100 - Constants.FEED_HEADER_HEIGHT - 32
    : vh * 100 - Constants.FEED_HEADER_HEIGHT - DECK_FEED_ITEM_MARGIN - 140;
  const maxWidth = availHeight * Constants.CARD_RATIO;
  const padding = (vw * 100 - maxWidth) / 2;
  return padding > 0 ? padding : 0;
};

const DECK_FEED_ITEM_HEIGHT =
  (1 / Constants.CARD_RATIO) * (100 * vw - getItemHorzPadding() * 2) + // height of preview
  DECK_FEED_ITEM_MARGIN + // margin between items
  Constants.FEED_ITEM_HEADER_HEIGHT; // height of the creator header

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
    marginTop: Constants.FEED_ITEM_HEADER_HEIGHT,
    aspectRatio: Constants.CARD_RATIO,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCardSkeleton: {
    backgroundColor: '#262626',
    borderRadius: Constants.CARD_BORDER_RADIUS,
  },
  itemHeader: {
    position: 'absolute',
    width: '100%',
    height: Constants.FEED_ITEM_HEADER_HEIGHT + Constants.CARD_BORDER_RADIUS,
    top: 0,
    borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
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
      paddingHorizontal: getItemHorzPadding(),
    },
  ];
};

const cardAspectFitStyles = makeCardAspectFitStyles();

// renders the current focused deck in the feed
const CurrentDeckCell = ({
  deck,
  isPlaying,
  onPressDeck,
  playingTransition,
  previewVideoPaused,
  onRefreshFeed,
  isMe = false,
  isAnonymous = false,
}) => {
  const initialCard = deck?.initialCard;
  const [ready, setReady] = React.useState(false);
  const isFocused = useIsFocused();

  React.useEffect(() => {
    let timeout;
    const task = InteractionManager.runAfterInteractions(() => {
      if (deck && isPlaying && isFocused) {
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
  }, [deck, isPlaying, isFocused]);

  const onSelectPlay = () => onPressDeck({ deckId: deck.deckId });
  const onPressBack = React.useCallback(() => onPressDeck({ deckId: undefined }), [onPressDeck]);
  const onBlockUser = React.useCallback(async () => {
    await blockUser(deck?.creator?.userId, true);
    if (onRefreshFeed) {
      onRefreshFeed();
    }
  }, [onRefreshFeed, deck]);
  const onReportDeck = React.useCallback(async () => {
    await reportDeck(deck.deckId);
    if (onRefreshFeed) {
      onRefreshFeed();
    }
  }, [onRefreshFeed, deck]);

  if (Constants.Android) {
    const onHardwareBackPress = React.useCallback(() => {
      if (isPlaying) {
        onPressBack();
        return true;
      }
      return false;
    }, [isPlaying, onPressBack]);

    // with no game loaded, use standard back handler
    useFocusEffect(
      React.useCallback(() => {
        BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);

        return () => BackHandler.removeEventListener('hardwareBackPress', onHardwareBackPress);
      }, [onHardwareBackPress])
    );

    // after the game loads, it listens for keyboard events and
    // causes react native's back button event to fail
    useListen({
      eventName: 'CASTLE_SYSTEM_BACK_BUTTON',
      handler: onHardwareBackPress,
    });
  }

  // when playing, move the header and footer to the screen edges
  const playingHeaderY = playingTransition.interpolate({
    inputRange: [0, 1.01],
    outputRange: [0, -Constants.FEED_HEADER_HEIGHT],
  });

  if (!initialCard) return null;

  return (
    <View
      style={[
        cardAspectFitStyles,
        {
          overflow: 'visible',
          paddingHorizontal: getItemHorzPadding({ isPlaying }),
        },
      ]}>
      <Animated.View
        style={[
          styles.itemHeader,
          {
            transform: [{ translateY: playingHeaderY }],
            backgroundColor: Utilities.getCardBackgroundColor(deck.initialCard),
          },
        ]}>
        <PlayDeckActions
          deck={deck}
          isPlaying={isPlaying}
          onPressBack={onPressBack}
          additionalPadding={getItemHorzPadding()}
          isMe={isMe}
          isAnonymous={isAnonymous}
          onBlockUser={onBlockUser}
          onReportDeck={onReportDeck}
        />
      </Animated.View>
      <View style={styles.itemCard}>
        <CardCell
          card={initialCard}
          previewVideo={!ready && deck?.previewVideo && isFocused ? deck.previewVideo : undefined}
          onPress={onSelectPlay}
          previewVideoPaused={previewVideoPaused}
        />
        {ready ? (
          <View style={styles.absoluteFill}>
            <PlayDeckNavigator
              deckId={deck.deckId}
              visibility={deck.visibility}
              initialCardId={deck.initialCard && deck.initialCard.cardId}
              initialDeckState={Utilities.makeInitialDeckState(deck)}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
};

const SkeletonFeed = () => {
  return (
    <View
      style={{
        height: '100%',
        width: '100%',
        paddingTop: Constants.FEED_HEADER_HEIGHT,
      }}>
      <View style={cardAspectFitStyles}>
        <View style={[styles.itemHeader, { backgroundColor: '#3c3c3c' }]}>
          <PlayDeckActionsSkeleton />
        </View>
        <View style={[styles.itemCard, styles.itemCardSkeleton]} />
      </View>
      <View style={cardAspectFitStyles}>
        <View style={[styles.itemHeader, { backgroundColor: '#3c3c3c' }]}>
          <PlayDeckActionsSkeleton />
        </View>
        <View style={[styles.itemCard, styles.itemCardSkeleton]} />
      </View>
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

// NOTE: onRefresh is currently ignored on Android (see further note below)
// otherwise, FlatList props work here.
export const DecksFeed = ({ decks, isPlaying, onPressDeck, ...props }) => {
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const { userId: signedInUserId, isAnonymous } = useSession();

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
    outputRange: [0, 300],
  });
  const backgroundColor = Utilities.getCardBackgroundColor(
    decks ? decks[currentCardIndex]?.initialCard : null
  );
  const playingBackgroundColor = playingTransitionNonNative.interpolate({
    inputRange: [0, 0.6, 1.01],
    outputRange: ['rgba(0, 0, 0, 1)', backgroundColor, backgroundColor],
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
            isMe={deck?.creator?.userId === signedInUserId}
            isAnonymous={isAnonymous}
            onRefreshFeed={props.onRefresh}
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
            {deck ? (
              <View
                style={[
                  styles.itemHeader,
                  { backgroundColor: Utilities.getCardBackgroundColor(deck.initialCard) },
                ]}>
                <PlayDeckActions
                  deck={deck}
                  disabled={true}
                  additionalPadding={getItemHorzPadding()}
                />
              </View>
            ) : null}
            <View style={styles.itemCard}>
              {deck ? (
                <CardCell
                  card={deck.initialCard}
                  previewVideo={deck?.previewVideo}
                  previewVideoPaused
                />
              ) : null}
            </View>
          </Animated.View>
        );
      }
    },
    [currentCardIndex, isPlaying, paused, props?.onRefresh]
  );

  const logScrollToDeck = React.useCallback(
    ({ index, deck }) => {
      if (!isPlaying) {
        Amplitude.logEventWithProperties('VIEW_FEED_ITEM', { index, deckId: deck?.deckId });
      }
    },
    [isPlaying]
  );
  const debounceLogScrollToDeck = debounce(({ ...args }) => logScrollToDeck(args), 500);

  const viewabilityConfig = React.useRef({ itemVisiblePercentThreshold: 90 }).current;
  const onViewableItemsChanged = React.useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentCardIndex(viewableItems[0].index);
      debounceLogScrollToDeck({ index: viewableItems[0].index, deck: viewableItems[0].item });
    }
  }, []);

  const getItemLayout = React.useCallback(
    (data, index) => ({
      length: DECK_FEED_ITEM_HEIGHT,
      offset: DECK_FEED_ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const onScrollBeginDrag = React.useCallback(() => setPaused(true), []);
  const onScrollEndDrag = React.useCallback(() => setPaused(false), []);

  // android: refresh control will still intercept pan events on the game
  // even when scrollEnabled is false. further, dynamically changing the value of onRefresh
  // on android messes up the scrollview rendering. so, just disable it
  const onRefresh = Constants.Android ? undefined : props.onRefresh;

  return (
    <>
      {!decks && <SkeletonFeed />}
      <Animated.View style={[styles.container, { backgroundColor: playingBackgroundColor }]}>
        <FlatList
          {...props}
          data={decks}
          contentContainerStyle={{ paddingTop: Constants.FEED_HEADER_HEIGHT }}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          keyExtractor={(item, index) => item?.deckId}
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
          initialNumToRender={3}
          windowSize={5}
          maxToRenderPerBatch={3}
          onRefresh={onRefresh}
        />
      </Animated.View>
    </>
  );
};
