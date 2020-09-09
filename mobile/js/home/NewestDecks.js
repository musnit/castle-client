import React from 'react';
import { StatusBar } from 'react-native';
import { DecksGrid } from '../components/DecksGrid';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect, useScrollToTop } from '../ReactNavigation';
import gql from 'graphql-tag';

import * as Constants from '../Constants';

const REFETCH_FEED_INTERVAL_MS = 30 * 1000;

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
