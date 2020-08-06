import React from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { CardCell } from '../components/CardCell';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect, useScrollToTop } from '@react-navigation/native';
import gql from 'graphql-tag';

import * as Constants from '../Constants';

const REFETCH_FEED_INTERVAL_MS = 30 * 1000;
const SCROLL_LOAD_MORE_BUFFER = 96;

const styles = StyleSheet.create({
  scrollView: {
    paddingLeft: 16,
    paddingTop: 16,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  deckCell: {
    width: '33%',
    paddingRight: 16,
    paddingBottom: 16,
  },
});

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

  const onScroll = React.useCallback(
    (e) => {
      if (e?.nativeEvent) {
        const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
        // reached bottom of scrollview (minus buffer)? load more
        if (
          contentOffset.y + layoutMeasurement.height >=
          contentSize.height - SCROLL_LOAD_MORE_BUFFER
        ) {
          if (!query.loading && decks?.length && contentSize.height > 192) {
            const lastModifiedBefore = decks[decks.length - 1].lastModified;
            onRefresh(lastModifiedBefore);
          }
        }
      }
    },
    [query.loading, decks?.length]
  );

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

  const refreshControl = (
    <RefreshControl
      refreshing={lastFetched.time && query.loading}
      onRefresh={onRefresh}
      tintColor="#fff"
      colors={['#fff', '#ccc']}
    />
  );

  return (
    <ScrollView
      ref={scrollViewRef}
      onScroll={onScroll}
      scrollEventThrottle={100}
      contentContainerStyle={styles.scrollView}
      refreshControl={refreshControl}>
      {decks
        ? decks.map((deck, ii) => (
            <View key={`deck-${deck.deckId}-${ii}`} style={styles.deckCell}>
              <CardCell
                card={deck.initialCard}
                onPress={() =>
                  navigate('PlayDeck', {
                    decks,
                    initialDeckIndex: ii,
                    title: 'Newest',
                  })
                }
              />
            </View>
          ))
        : null}
    </ScrollView>
  );
};
