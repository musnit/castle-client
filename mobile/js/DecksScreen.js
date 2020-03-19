import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  PanResponder,
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import gql from 'graphql-tag';
import { useSafeArea, SafeAreaView } from 'react-native-safe-area-context';
import { useLazyQuery } from '@apollo/react-hooks';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

import CardCell from './CardCell';
import * as Constants from './Constants';
import FastImage from 'react-native-fast-image';
import GameUrlInput from './GameUrlInput';
import Viewport from './viewport';
import PlayDeckNavigator from './PlayDeckNavigator';
import { MainSwitcherContext } from './MainSwitcher';

const { vw, vh } = Viewport;

const REFETCH_FEED_INTERVAL_MS = 30 * 1000;

const DECK_FEED_ITEM_MARGIN = 2;
const DECK_FEED_ITEM_HEIGHT =
  (1 / Constants.CARD_RATIO) * 100 * vw + // height of card
  DECK_FEED_ITEM_MARGIN; // margin below cell

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  deckFeedItemContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: DECK_FEED_ITEM_MARGIN,
  },
  deckFeedItemCard: {
    aspectRatio: Constants.CARD_RATIO,
    width: '100%',
  },
  topSpacer: {},
});

const DeckFeedItem = React.memo(({ deck, focused, setInteracting, onPressPreview }) => {
  // `setReady(true)` some time after `focused` becomes `true`
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let timeout;
    let active = true;
    if (focused) {
      timeout = setTimeout(() => {
        if (active) {
          setReady(true);
        }
      }, 140);
    } else {
      setReady(false);
    }
    return () => {
      active = false;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [focused]);

  // create a pan responder which tells the parent scrollview to
  // stop capturing scroll gestures whenever we are interacting with the scene.
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
    onMoveShouldSetPanResponder: (evt, gestureState) => true,
    onMoveShouldSetPanResponderCapture: (evt, gestureState) => false,
    onPanResponderGrant: () => setInteracting(true),
    onPanResponderMove: () => {},
    onPanResponderRelease: () => setInteracting(false),
  });

  return (
    <View style={styles.deckFeedItemContainer}>
      <View style={styles.deckFeedItemCard}>
        <CardCell card={deck.initialCard} onPress={onPressPreview} />
        {focused && ready ? (
          <View
            {...panResponder.panHandlers}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
            }}>
            <PlayDeckNavigator
              deckId={deck.deckId}
              cardId={deck.initialCard && deck.initialCard.cardId}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
});

const DecksScreen = (props) => {
  const [lastFetchedTime, setLastFetchedTime] = React.useState(null);

  const insets = useSafeArea();
  let paddingTop = 0;
  if (vh * 100 >= DECK_FEED_ITEM_HEIGHT - DECK_FEED_ITEM_MARGIN + insets.top) {
    paddingTop = insets.top;
  }

  const topSpacerHeight = (100 * vh - insets.top - DECK_FEED_ITEM_HEIGHT) / 2;

  const [fetchDecks, query] = useLazyQuery(
    gql`
      query {
        allDecks {
          id
          deckId
          title
          creator {
            userId
            username
          }
          initialCard {
            id
            cardId
            title
            backgroundImage {
              fileId
              url
              primaryColor
            }
            blocks {
              id
              cardBlockId
              cardBlockUpdateId
              type
              title
              destinationCardId
            }
          }
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  const isFocused = useIsFocused();

  const { mode: mainSwitcherMode } = useContext(MainSwitcherContext); // Dealing with legacy game loading path

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Constants.Android && StatusBar.setTranslucent(true); // needed for tab navigator
      if (!lastFetchedTime || Date.now() - lastFetchedTime > REFETCH_FEED_INTERVAL_MS) {
        fetchDecks();
        setLastFetchedTime(Date.now());
      }
    }, [lastFetchedTime])
  );

  let decks;
  if (query.called && !query.loading && !query.error && query.data) {
    decks = query.data.allDecks;
  }

  const scrollViewRef = React.useRef(null);
  const [interacting, setInteracting] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [draggingScrollView, setDraggingScrollView] = useState(false);
  const [scrollToItemOffsets, setScrollToItemOffsets] = useState({
    prev: 0,
    next: DECK_FEED_ITEM_HEIGHT,
  });
  const onScroll = ({
    nativeEvent: {
      contentOffset: { y },
    },
  }) => {
    const snapDist = Math.abs(
      y - DECK_FEED_ITEM_HEIGHT * Math.floor(y / DECK_FEED_ITEM_HEIGHT + 0.5)
    );
    const index = Math.floor(y / DECK_FEED_ITEM_HEIGHT + 0.5);
    if (index !== focusedIndex && !draggingScrollView) {
      if (snapDist <= 0.02 * DECK_FEED_ITEM_HEIGHT) {
        setScrollToItemOffsets({
          prev: Math.max(0, y + snapDist - DECK_FEED_ITEM_HEIGHT),
          next: y + snapDist + DECK_FEED_ITEM_HEIGHT,
        });
        setFocusedIndex(index);
      } else {
        setScrollToItemOffsets({ prev: 0, next: DECK_FEED_ITEM_HEIGHT });
        setFocusedIndex(null);
      }
    }
  };

  const onPressNoop = () => {};
  const onPressPrevious = React.useCallback(() => {
    scrollViewRef.current.scrollTo({ y: scrollToItemOffsets.prev });
  }, [scrollToItemOffsets, scrollViewRef.current]);
  const onPressNext = React.useCallback(() => {
    scrollViewRef.current.scrollTo({ y: scrollToItemOffsets.next });
  }, [scrollToItemOffsets, scrollViewRef.current]);

  return (
    <View style={[styles.container, { paddingTop: paddingTop }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView
        ref={scrollViewRef}
        scrollEnabled={!interacting}
        contentContainerStyle={styles.scrollView}
        snapToInterval={DECK_FEED_ITEM_HEIGHT}
        decelerationRate={0.9}
        onScroll={onScroll}
        onScrollBeginDrag={() => setDraggingScrollView(true)}
        onScrollEndDrag={() => setDraggingScrollView(false)}
        scrollEventThrottle={80}>
        <View style={{ height: topSpacerHeight }} />
        {decks &&
          decks.map((deck, i) => {
            const focused = mainSwitcherMode === 'navigator' && isFocused && focusedIndex == i;
            let onPressPreview = onPressNoop;
            if (focusedIndex == i + 1) {
              onPressPreview = onPressPrevious;
            } else if (focusedIndex == i - 1) {
              onPressPreview = onPressNext;
            }
            return (
              <DeckFeedItem
                key={deck.deckId}
                deck={deck}
                focused={focused}
                setInteracting={setInteracting}
                onPressPreview={onPressPreview}
              />
            );
          })}
      </ScrollView>
    </View>
  );
};

export default DecksScreen;
