import React, { Fragment } from 'react';
import { AppUpdateNotice } from '../components/AppUpdateNotice';
import { DecksFeed } from '../components/DecksFeed';
import { NativeDecksFeed } from '../components/NativeDecksFeed';
import { EmptyFeed } from './EmptyFeed';
import { useLazyQuery, useMutation, gql } from '@apollo/client';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import uniqby from 'lodash.uniqby';

import * as Constants from '../Constants';

const REFETCH_FEED_INTERVAL_MS = 60 * 60 * 1000;

export const FeaturedDecks = ({
  focused,
  deckId,
  onPressComments,
  onCloseComments,
  isCommentsOpen,
}) => {
  if (Constants.USE_NATIVE_FEED) {
    return <NativeDecksFeed onPressComments={onPressComments} isCommentsOpen={isCommentsOpen} onCloseComments={onCloseComments} screenId='featuredFeed' />;
  }

  const { navigate } = useNavigation();
  const [lastFetched, setLastFetched] = React.useState({
    time: undefined,
  });
  const [sessionId, setSessionId] = React.useState(undefined);
  const [decks, changeDecks] = React.useReducer((decks, action) => {
    switch (action.type) {
      case 'set':
        return action.decks;
      case 'append':
        return uniqby(decks.concat(action.decks), 'deckId');
      default:
        throw new Error(`Unrecognized decks action: ${action.type}`);
    }
  }, undefined);
  const [error, setError] = React.useState(undefined);
  const [fetchDecks, query] = useLazyQuery(
    gql`
      query InfiniteFeed($sessionId: ID) {
        infiniteFeed(sessionId: $sessionId) {
          sessionId
          decks {
            ${Constants.FEED_ITEM_DECK_FRAGMENT}
          }
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  const [markDeckViewFocused, markDeckViewFocusedQuery] = useMutation(
    gql`
      mutation markDeckViewFocused($deckId: ID!, $sessionId: ID!) {
        markDeckViewFocused(deckId: $deckId, sessionId: $sessionId)
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  const onRefresh = React.useCallback(() => {
    fetchDecks({
      variables: {
        sessionId,
      },
    });
    setLastFetched({ time: Date.now() });
  }, [fetchDecks, setLastFetched, sessionId]);

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
      onRefresh();
    }
  }, [query.loading, decks, onRefresh]);

  const onDeckFocused = React.useCallback(
    ({ deckId }) => {
      markDeckViewFocused({
        variables: {
          deckId,
          sessionId,
        },
      });
    },
    [markDeckViewFocused, sessionId]
  );

  React.useEffect(() => {
    if (query.called && !query.loading) {
      if (query.data) {
        setSessionId(query.data.infiniteFeed.sessionId);
        if (decks) {
          changeDecks({ type: 'append', decks: query.data.infiniteFeed.decks });
        } else {
          changeDecks({ type: 'set', decks: query.data.infiniteFeed.decks });
        }
        setError(undefined);
      } else if (query.error) {
        setError(query.error);
      }
    } else {
      setError(undefined);
    }
  }, [query.called, query.loading, query.error, query.data]);

  return (
    <Fragment>
      {error ? (
        <EmptyFeed error={error} onRefresh={onRefresh} />
      ) : (
        <DecksFeed
          decks={decks}
          isPlaying={deckId !== undefined}
          onDeckFocused={onDeckFocused}
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
        />
      )}
      <AppUpdateNotice />
    </Fragment>
  );
};
