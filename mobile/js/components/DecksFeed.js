import React from 'react';
import { Animated, FlatList, InteractionManager, StyleSheet, View } from 'react-native';
import { CardCell } from './CardCell';
import { PlayDeckActions, PlayDeckActionsSkeleton } from '../play/PlayDeckActions';
import { PlayDeckFooter } from '../play/PlayDeckFooter';
import { PlayDeckNavigator } from '../play/PlayDeckNavigator';
import { useGameViewAndroidBackHandler } from '../common/GameViewAndroidBackHandler';
import { useIsFocused } from '../ReactNavigation';
import { useSession, blockUser, reportDeck } from '../Session';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const getItemHeight = ({ isPlaying = false } = {}) => {
  return (
    (1 / Constants.CARD_RATIO) * (100 * vw - getItemHorzPadding({ isPlaying }) * 2) + // height of preview
    DECK_FEED_ITEM_MARGIN + // margin between items
    Constants.FEED_ITEM_HEADER_HEIGHT
  ); // height of the creator header
};

const DECK_FEED_ITEM_DEFAULT_HEIGHT = getItemHeight();

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
    backgroundColor: Constants.colors.skeletonBG,
    borderRadius: Constants.CARD_BORDER_RADIUS,
  },
  itemHeader: {
    position: 'absolute',
    width: '100%',
    height: Constants.FEED_ITEM_HEADER_HEIGHT + Constants.CARD_BORDER_RADIUS,
    borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
  },
  itemFooter: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    height: 72,
    zIndex: 1,
    elevation: 1,
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});

// CurrentDeckCell uses absolute positioning to expand on top of surrounding cells
// when playing a deck. By default, the next cell in the list covers touches in the cell
// footer. To fix this, invert FlatList's default z index so earlier cells are on top
// of later cells.
// https://github.com/facebook/react-native/issues/18616#issuecomment-389444165
const InvertZIndexCellRendererComponent = ({ children, index, style, ...props }) => {
  const cellStyle = [style, { zIndex: 1000 - index, elevation: 1000 - index }];
  return (
    <View index={index} style={cellStyle} {...props}>
      {children}
    </View>
  );
};

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
  const insets = useSafeAreaInsets();

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

  const playingFooterY = playingTransition.interpolate({
    inputRange: [0, 1.01],
    outputRange: [0, vh * 100 - getItemHeight({ isPlaying: true }) - insets.bottom],
  });

  const onHardwareBackPress = React.useCallback(() => {
    if (isPlaying) {
      onPressBack();
      return true;
    }
    return false;
  }, [isPlaying, onPressBack]);
  useGameViewAndroidBackHandler({ onHardwareBackPress });

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
      <Animated.View style={styles.itemHeader}>
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
      <Animated.View style={[styles.itemFooter, { transform: [{ translateY: playingFooterY }] }]}>
        <PlayDeckFooter deck={deck} />
      </Animated.View>
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
          <Animated.View style={[cardAspectFitStyles, translateStyles]} pointerEvents="none">
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
  const onViewableItemsChanged = React.useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentCardIndex(viewableItems[0].index);
      debounceLogScrollToDeck({ index: viewableItems[0].index, deck: viewableItems[0].item });
    }
  });

  const getItemLayout = React.useCallback(
    (data, index) => ({
      length: DECK_FEED_ITEM_DEFAULT_HEIGHT,
      offset: DECK_FEED_ITEM_DEFAULT_HEIGHT * index,
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

  // android: overflow doesn't work on single-deck lists unless this is defined,
  // but we dont' want it in multi-deck cases because it prevents scrolling
  const contentContainerStyle = Constants.Android && decks?.length === 1 ? { flex: 1 } : undefined;

  return (
    <>
      {!decks && <SkeletonFeed />}
      <Animated.View style={[styles.container, { backgroundColor: playingBackgroundColor }]}>
        <FlatList
          {...props}
          CellRendererComponent={InvertZIndexCellRendererComponent}
          data={decks}
          contentContainerStyle={contentContainerStyle}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          keyExtractor={(item, index) => item?.deckId}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isPlaying}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          snapToAlignment="start"
          snapToInterval={DECK_FEED_ITEM_DEFAULT_HEIGHT}
          decelerationRate="fast"
          pagingEnabled
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged.current}
          initialNumToRender={3}
          windowSize={5}
          maxToRenderPerBatch={3}
          onRefresh={onRefresh}
        />
      </Animated.View>
    </>
  );
};
