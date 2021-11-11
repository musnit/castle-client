import React from 'react';
import { DecksFeed } from '../components/DecksFeed';
import { EmptyFeed } from './EmptyFeed';
import { useLazyQuery, gql } from '@apollo/client';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import { useSession } from '../Session';

import * as Constants from '../Constants';

const REFETCH_FEED_INTERVAL_MS = 30 * 1000;

export const FollowingDecks = ({ deckId, onPressComments, onCloseComments, isCommentsOpen }) => {
  const { navigate } = useNavigation();
  const { markFollowingFeedRead } = useSession();
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
      query FollowingFeed($lastModifiedBefore: Datetime) {
        followingFeed(limit: 24, lastModifiedBefore: $lastModifiedBefore) {
          ${Constants.FEED_ITEM_DECK_FRAGMENT}
        }
      }
    `
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
      if (
        (!lastFetched.time || Date.now() - lastFetched.time > REFETCH_FEED_INTERVAL_MS) &&
        deckId === undefined
      ) {
        onRefresh();
      }
    }, [lastFetched.time, deckId, onRefresh])
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
        changeDecks({ type: 'append', decks: query.data.followingFeed });
      } else {
        // clean refresh
        changeDecks({ type: 'set', decks: query.data.followingFeed });
        markFollowingFeedRead(); // mark read when top of feed loaded
      }
    }
  }, [query.called, query.loading, query.error, query.data, lastFetched.lastModifiedBefore]);

  return decks?.length || query.loading ? (
    <DecksFeed
      decks={decks}
      isPlaying={deckId !== undefined}
      onPressDeck={({ deckId }) =>
        navigate('HomeScreen', {
          deckId,
        })
      }
      onPressComments={onPressComments}
      onCloseComments={onCloseComments}
      isCommentsOpen={isCommentsOpen}
      refreshing={!!(lastFetched.time && query.loading && decks?.length)}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.15}
    />
  ) : (
    <EmptyFeed message="Follow people you know on Castle to see their decks here." />
  );
};
