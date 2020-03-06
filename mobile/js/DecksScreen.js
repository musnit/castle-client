import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
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

const DECK_FEED_ITEM_MARGIN = 128;
const DECK_FEED_ITEM_HEIGHT =
  (16 / 9) * 100 * vw + // height of card
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
    aspectRatio: 9 / 16,
    width: '100%',
  },
});

const DeckFeedItem = React.memo(
  ({ deck, focused, interactionEnabled, onToggleInteraction }) => {
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

    return (
      <View style={styles.deckFeedItemContainer}>
        <View style={styles.deckFeedItemCard}>
          <CardCell card={deck.initialCard} onPress={() => {}} />
          {focused && ready ? (
            <View
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
                interactionEnabled={interactionEnabled}
                onToggleInteraction={onToggleInteraction}
              />
            </View>
          ) : null}
        </View>
      </View>
    );
  }
);

const DecksScreen = (props) => {
  const [lastFetchedTime, setLastFetchedTime] = React.useState(null);

  const insets = useSafeArea();
  let paddingTop = 0;
  if (vh * 100 >= DECK_FEED_ITEM_HEIGHT - DECK_FEED_ITEM_MARGIN + insets.top) {
    paddingTop = insets.top;
  }

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

  const [focusedIndex, setFocusedIndex] = useState(0);
  const onScroll = ({
    nativeEvent: {
      contentOffset: { y },
    },
  }) => {
    const snapDist = Math.abs(
      y - DECK_FEED_ITEM_HEIGHT * Math.floor(y / DECK_FEED_ITEM_HEIGHT + 0.5)
    );
    const index = Math.floor(y / DECK_FEED_ITEM_HEIGHT + 0.5);
    if (index !== focusedIndex) {
      if (snapDist <= 0.02 * DECK_FEED_ITEM_HEIGHT) {
        setFocusedIndex(index);
      } else {
        setFocusedIndex(null);
      }
    }
  };

  const [interactionEnabled, setInteractionEnabled] = useState(false);
  const onToggleInteraction = () => {
    setInteractionEnabled(!interactionEnabled);
  };

  return (
    <View style={[styles.container, { paddingTop: paddingTop }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView
        scrollEnabled={!interactionEnabled}
        contentContainerStyle={styles.scrollView}
        snapToInterval={DECK_FEED_ITEM_HEIGHT}
        decelerationRate={0.9}
        onScroll={onScroll}
        scrollEventThrottle={80}>
        {decks &&
          decks.map((deck, i) => {
            const focused = mainSwitcherMode === 'navigator' && isFocused && focusedIndex == i;
            return (
              <DeckFeedItem
                key={deck.deckId}
                deck={deck}
                focused={focused}
                interactionEnabled={focused && interactionEnabled}
                onToggleInteraction={onToggleInteraction}
              />
            );
          })}
      </ScrollView>
    </View>
  );
};

export default DecksScreen;
