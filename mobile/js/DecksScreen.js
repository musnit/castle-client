import React, { useState } from 'react';
import { View, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import gql from 'graphql-tag';
import { useSafeArea, SafeAreaView } from 'react-native-safe-area-context';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import CardCell from './CardCell';
import FastImage from 'react-native-fast-image';
import GameUrlInput from './GameUrlInput';
import Viewport from './viewport';
import PlayCardScreen from './PlayCardScreen';

const { vw, vh } = Viewport;

const REFETCH_FEED_INTERVAL_MS = 30 * 1000;

const DECK_FEED_ITEM_HEIGHT =
  (16 / 9) * 100 * vw + // height of card
  32; // margin below cell

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  deckFeedItemContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  deckFeedItemCard: {
    aspectRatio: 9 / 16,
    width: '100%',
  },
});

const DeckFeedItem = ({ deck, focused }) => {
  const navigation = useNavigation();

  const [ready, setReady] = useState(false);

  const [lastFocused, setLastFocused] = useState(false);
  if (!lastFocused && focused) {
    setReady(false);
    setTimeout(() => {
      setReady(true);
    }, 80);
  }
  if (lastFocused !== focused) {
    setLastFocused(focused);
  }

  return (
    <View style={styles.deckFeedItemContainer}>
      <View style={styles.deckFeedItemCard}>
        <CardCell
          card={deck.initialCard}
          onPress={() => {}}
        />
        {focused && ready ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
            }}>
            <PlayCardScreen
              deckId={deck.deckId}
              cardId={deck.initialCard && deck.initialCard.cardId}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
};

const DecksScreen = (props) => {
  const [lastFetchedTime, setLastFetchedTime] = React.useState(null);
  const insets = useSafeArea();
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

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
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
    const newFocusedIndex = Math.floor(y / DECK_FEED_ITEM_HEIGHT + 0.5);
    if (newFocusedIndex !== focusedIndex) {
      setFocusedIndex(newFocusedIndex);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollView}
        snapToInterval={DECK_FEED_ITEM_HEIGHT}
        decelerationRate={0.9}
        onScroll={onScroll}
        scrollEventThrottle={300}>
        {decks &&
          decks.map((deck, i) => (
            <DeckFeedItem key={deck.deckId} deck={deck} focused={focusedIndex == i} />
          ))}
      </ScrollView>
    </View>
  );
};

export default DecksScreen;
