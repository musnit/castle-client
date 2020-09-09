import React from 'react';
import { FlatList, StatusBar, Text, View } from 'react-native';
import { CardGridRow } from '../components/CardGridRow';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect, useScrollToTop } from '@react-navigation/native';
import gql from 'graphql-tag';

import * as Constants from '../Constants';

const REFETCH_FEED_INTERVAL_MS = 30 * 1000;

export const FeaturedDecks = ({ focused }) => {
  const { navigate } = useNavigation();
  const [lastFetched, setLastFetched] = React.useState({
    time: undefined,
  });
  const [decks, setDecks] = React.useState(undefined);
  const [groupedDecks, setGroupedDecks] = React.useState([]);
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
  React.useEffect(() => {
    const newGroupedDecks = decks
      ? decks.reduce((grouped, deck, index) => {
          if (index % 3 == 0) {
            grouped.push([deck]);
          } else {
            grouped[grouped.length - 1].push(deck);
          }
          return grouped;
        }, [])
      : [];
    setGroupedDecks(newGroupedDecks);
  }, [decks]);

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

  const renderItem = ({ item, index }) => {
    let row = index;
    return (
      <CardGridRow
        decks={item}
        onPress={(deck, col) =>
          navigate('PlayDeck', {
            decks,
            initialDeckIndex: row * 3 + col,
            title: 'Featured',
          })
        }
      />
    );
  };

  return (
    <FlatList
      ref={scrollViewRef}
      contentContainerStyle={{ paddingTop: 16 }}
      data={groupedDecks}
      renderItem={renderItem}
      keyExtractor={(item, index) =>
        item.length ? `row-${item[0].deckId}-${index}` : `row-${index}`
      }
      refreshing={!!(lastFetched.time && query.loading)}
      onRefresh={onRefresh}
    />
  );
};
