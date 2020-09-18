import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { DecksGrid } from '../components/DecksGrid';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect, useScrollToTop } from '../ReactNavigation';
import gql from 'graphql-tag';

import * as Constants from '../Constants';
import * as Session from '../Session';

const REFETCH_FEED_INTERVAL_MS = 60 * 1000;

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
  const [error, setError] = React.useState(undefined);

  const [fetchDecks, query] = useLazyQuery(
    gql`
      query DeckHistory {
        deckHistory(limit: 24) {
          ${Constants.FEED_ITEM_DECK_FRAGMENT}
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  const onRefresh = React.useCallback(() => {
    fetchDecks();
    setLastFetchedTime(Date.now());
  }, [fetchDecks, setLastFetchedTime]);

  useFocusEffect(onRefresh);
  useFocusEffect(
    React.useCallback(() => {
      if (!lastFetchedTime || Date.now() - lastFetchedTime > REFETCH_FEED_INTERVAL_MS) {
        onRefresh();
      }
    }),
    [lastFetchedTime]
  );

  React.useEffect(() => {
    if (query.called && !query.loading && !query.error && query.data) {
      setDecks(query.data.deckHistory);
    }
  }, [query.called, query.loading, query.error, query.data]);

  const scrollViewRef = React.useRef(null);
  useScrollToTop(scrollViewRef);

  return decks?.length ? (
    <DecksGrid
      decks={decks}
      scrollViewRef={scrollViewRef}
      refreshing={lastFetchedTime && query.loading}
      onRefresh={onRefresh}
      onPressDeck={(deck, index) =>
        navigate(
          'PlayDeck',
          {
            decks,
            initialDeckIndex: index,
            title: 'Recent',
          },
          {
            isFullscreen: true,
          }
        )
      }
    />
  ) : error ? (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{error}</Text>
    </View>
  ) : lastFetchedTime && !query.loading ? (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>You haven't played any decks recently.</Text>
    </View>
  ) : null;
};
