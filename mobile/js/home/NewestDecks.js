import React from 'react';
import { StatusBar } from 'react-native';
import { DecksGrid } from '../components/DecksGrid';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect, useScrollToTop } from '@react-navigation/native';
import gql from 'graphql-tag';

import * as Constants from '../Constants';

const REFETCH_FEED_INTERVAL_MS = 30 * 1000;

export const NewestDecks = ({ focused }) => {
  const { navigate } = useNavigation();
  const [lastFetched, setLastFetched] = React.useState({
    time: undefined,
    lastModifiedBefore: undefined,
  });
  const [decks, changeDecks] = React.useReducer((decks, action) => {
    switch (action.type) {
      case 'set':
        return action.decks;
      case 'append':
        return decks.concat(action.decks);
      default:
        throw new Error(`Unrecognized decks action: ${action.type}`);
    }
  }, undefined);
  const [fetchDecks, query] = useLazyQuery(
    gql`
      query DeckFeed($lastModifiedBefore: Datetime) {
        deckFeed(limit: 24, lastModifiedBefore: $lastModifiedBefore) {
          ${Constants.FEED_ITEM_DECK_FRAGMENT}
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  const onRefresh = React.useCallback(
    (lastModifiedBefore) => {
      fetchDecks({
        variables: {
          lastModifiedBefore,
        },
      });
      setLastFetched({ time: Date.now(), lastModifiedBefore });
    },
    [fetchDecks, setLastFetched]
  );

  useFocusEffect(
    React.useCallback(() => {
      if (!lastFetched.time || Date.now() - lastFetched.time > REFETCH_FEED_INTERVAL_MS) {
        onRefresh();
      }
    }),
    [lastFetched.time]
  );

  const onEndReached = React.useCallback(() => {
    if (!query.loading && decks?.length) {
      const lastModifiedBefore = decks[decks.length - 1].lastModified;
      onRefresh(lastModifiedBefore);
    }
  }, [query.loading, decks?.length]);

  React.useEffect(() => {
    if (query.called && !query.loading && !query.error && query.data) {
      if (lastFetched.lastModifiedBefore) {
        // append next page
        changeDecks({ type: 'append', decks: query.data.deckFeed });
      } else {
        // clean refresh
        changeDecks({ type: 'set', decks: query.data.deckFeed });
      }
    }
  }, [query.called, query.loading, query.error, query.data, lastFetched.lastModifiedBefore]);

  const scrollViewRef = React.useRef(null);
  useScrollToTop(scrollViewRef);

  return (
    <DecksGrid
      decks={decks}
      scrollViewRef={scrollViewRef}
      onPressDeck={(deck, row, col) =>
        navigate('PlayDeck', {
          decks,
          initialDeckIndex: row * 3 + col,
          title: 'Newest',
        })
      }
      refreshing={!!(lastFetched.time && query.loading)}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
    />
  );
};
