import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { DecksGrid } from '../components/DecksGrid';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect, useScrollToTop } from '../ReactNavigation';
import gql from 'graphql-tag';
import Viewport from '../common/viewport';

import * as Constants from '../Constants';
import * as History from '../common/history';
import * as Session from '../Session';

const styles = StyleSheet.create({
  empty: {
    width: '100%',
    padding: 8,
    paddingTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
});

export const RecentDecks = ({ focused }) => {
  const { navigate } = useNavigation();
  const [lastFetchedTime, setLastFetchedTime] = React.useState(null);
  const [decks, setDecks] = React.useState(undefined);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(undefined);

  const fetchDecks = React.useCallback(async () => {
    setLoading(true);
    let decks;
    try {
      const historyItems = await History.getItems();
      const deckIds = historyItems.map((item) => item.deckId);
      decks = await Session.getDecksByIds(deckIds, Constants.FEED_ITEM_DECK_FRAGMENT);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
    setDecks(decks);
  }, [setDecks, setLoading, setError]);

  const onRefresh = React.useCallback(() => {
    fetchDecks();
    setLastFetchedTime(Date.now());
    return () => setLoading(false);
  }, [fetchDecks, setLastFetchedTime, setLoading]);

  useFocusEffect(onRefresh);

  const scrollViewRef = React.useRef(null);
  useScrollToTop(scrollViewRef);

  return decks?.length ? (
    <DecksGrid
      decks={decks}
      scrollViewRef={scrollViewRef}
      refreshing={lastFetchedTime && loading}
      onRefresh={onRefresh}
      onPressDeck={(deck, col, row) =>
        navigate('PlayDeck', {
          decks,
          initialDeckIndex: row * 3 + col,
          title: 'Recent',
        })
      }
    />
  ) : error ? (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{error}</Text>
    </View>
  ) : lastFetchedTime && !loading ? (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>You haven't played any decks recently.</Text>
    </View>
  ) : null;
};
