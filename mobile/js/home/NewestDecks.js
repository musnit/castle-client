import React from 'react';
import { FlatList, StatusBar, StyleSheet, Text, View, requireNativeComponent } from 'react-native';
import { CardCell } from '../components/CardCell';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect, useScrollToTop } from '../ReactNavigation';
import gql from 'graphql-tag';
import Viewport from '../common/viewport';

import * as Constants from '../Constants';

const REFETCH_FEED_INTERVAL_MS = 30 * 1000;
const SCROLL_LOAD_MORE_BUFFER = 96;

const NativeFeedView = requireNativeComponent('CastleFeedView', null);

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
  const [groupedDecks, setGroupedDecks] = React.useState([]);
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

  const renderItem = ({ item, index }) => {
    let ii = index;
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {item.map((deck, ii) => (
          <CardCell
            key={`card-${deck.initialCard.cardId}`}
            style={[
              Constants.styles.gridItem,
              { flex: 1, paddingLeft: ii > 0 && Constants.iOS ? 8 : 0 },
            ]}
            card={deck.initialCard}
            imageUrl={deck.creator.photo.url}
            onPress={() =>
              navigate(
                'PlayDeck',
                {
                  decks,
                  initialDeckIndex: ii,
                  title: 'Newest',
                },
                {
                  isFullscreen: true,
                }
              )
            }
          />
        ))}
      </View>
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
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
    />
  );

  /*return (
    <NativeFeedView
      decks={decks}
      style={{
        //flex: 1,
        width: 400,
        height: 600,
      }}
    />
  );*/
};
