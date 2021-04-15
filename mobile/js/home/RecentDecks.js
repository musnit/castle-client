import React from 'react';
import { DecksGrid } from '../components/DecksGrid';
import { EmptyFeed } from './EmptyFeed';
import { useLazyQuery, gql } from '@apollo/client';
import { useNavigation, useFocusEffect, useScrollToTop } from '../ReactNavigation';

import * as Constants from '../Constants';

const REFETCH_FEED_INTERVAL_MS = 60 * 1000;

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

  useFocusEffect(
    React.useCallback(() => {
      if (!lastFetchedTime || Date.now() - lastFetchedTime > REFETCH_FEED_INTERVAL_MS) {
        onRefresh();
      }
    }, [lastFetchedTime, onRefresh])
  );

  React.useEffect(() => {
    if (query.called && !query.loading && !query.error && query.data) {
      setDecks(query.data.deckHistory);
      setError(undefined);
    } else if (query.error) {
      setError(query.error);
    }
  }, [query.called, query.loading, query.error, query.data]);

  const scrollViewRef = React.useRef(null);
  useScrollToTop(scrollViewRef);

  return decks?.length ? (
    <DecksGrid
      decks={decks}
      contentContainerStyle={{ paddingTop: Constants.FEED_HEADER_HEIGHT + 16 }}
      scrollViewRef={scrollViewRef}
      refreshing={lastFetchedTime && query.loading}
      onRefresh={onRefresh}
      onPressDeck={(deck, index) =>
        navigate(
          'PlayDeck',
          {
            // TODO: support passing all decks here
            decks: [deck],
            initialDeckIndex: 0,
            title: 'Recent',
          },
          {
            isFullscreen: true,
          }
        )
      }
    />
  ) : error ? (
    <EmptyFeed message={error} />
  ) : lastFetchedTime && !query.loading ? (
    <EmptyFeed message="You haven't played any decks recently." />
  ) : null;
};
