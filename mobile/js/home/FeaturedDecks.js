import React from 'react';
import { StatusBar } from 'react-native';
import { DecksGrid } from '../components/DecksGrid';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect, useScrollToTop } from '../ReactNavigation';
import gql from 'graphql-tag';

import * as Constants from '../Constants';

const REFETCH_FEED_INTERVAL_MS = 60 * 60 * 1000;

export const FeaturedDecks = ({ focused }) => {
  const { navigate } = useNavigation();
  const [lastFetched, setLastFetched] = React.useState({
    time: undefined,
  });
  const [decks, setDecks] = React.useState(undefined);
  const [fetchDecks, query] = useLazyQuery(
    gql`
      query FeaturedFeed {
        featuredFeed {
          ${Constants.FEED_ITEM_DECK_FRAGMENT}
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  const onRefresh = React.useCallback(() => {
    fetchDecks();
    setLastFetched({ time: Date.now() });
  }, [fetchDecks, setLastFetched]);

  useFocusEffect(
    React.useCallback(() => {
      if (!lastFetched.time || Date.now() - lastFetched.time > REFETCH_FEED_INTERVAL_MS) {
        onRefresh();
      }
    }),
    [lastFetched.time]
  );

  React.useEffect(() => {
    if (query.called && !query.loading && !query.error && query.data) {
      setDecks(query.data.featuredFeed);
    }
  }, [query.called, query.loading, query.error, query.data]);

  const scrollViewRef = React.useRef(null);
  useScrollToTop(scrollViewRef);

  return (
    <DecksGrid
      decks={decks}
      scrollViewRef={scrollViewRef}
      onPressDeck={(deck, index) =>
        navigate(
          'PlayDeck',
          {
            decks,
            initialDeckIndex: index,
            title: 'Featured',
          },
          {
            isFullscreen: true,
          }
        )
      }
      refreshing={!!(lastFetched.time && query.loading)}
      onRefresh={onRefresh}
    />
  );
};
