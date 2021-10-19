import React from 'react';
import { DecksGrid } from '../components/DecksGrid';
import { useLazyQuery, gql } from '@apollo/client';
import { useNavigation, useFocusEffect, useScrollToTop } from '../ReactNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';

export const ExploreFeed = ({ route }) => {
  const feedId = route?.params.feedId;
  const title = route?.params.title;

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
      query paginateFeed($feedId: ID!, $lastModifiedBefore: Datetime) {
        paginateFeed(feedId: $feedId, lastModifiedBefore: $lastModifiedBefore) {
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
          feedId,
          lastModifiedBefore,
        },
      });
      setLastFetched({ time: Date.now(), lastModifiedBefore });
    },
    [fetchDecks, setLastFetched, feedId]
  );

  React.useEffect(onRefresh, [feedId]);

  useFocusEffect(
    React.useCallback(() => {
      Amplitude.logEvent('VIEW_EXPLORE_FEED', { feedId });
    }, [feedId])
  );

  const onEndReached = React.useCallback(() => {
    if (!query.loading && decks?.length) {
      const lastModifiedBefore = decks[decks.length - 1].lastModified;
      onRefresh(lastModifiedBefore);
    }
  }, [query.loading, decks, onRefresh]);

  React.useEffect(() => {
    if (query.called && !query.loading && !query.error && query.data) {
      if (lastFetched.lastModifiedBefore) {
        // append next page
        changeDecks({ type: 'append', decks: query.data.paginateFeed });
      } else {
        // clean refresh
        changeDecks({ type: 'set', decks: query.data.paginateFeed });
      }
    }
  }, [query.called, query.loading, query.error, query.data, lastFetched.lastModifiedBefore]);

  const scrollViewRef = React.useRef(null);
  useScrollToTop(scrollViewRef);

  return (
    <SafeAreaView style={Constants.styles.container}>
      <ScreenHeader title={title} />
      {decks?.length ? (
        <DecksGrid
          decks={decks}
          contentContainerStyle={{ paddingTop: 16 }}
          scrollViewRef={scrollViewRef}
          refreshing={lastFetched.time && query.loading}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.15}
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
      ) : null}
    </SafeAreaView>
  );
};
