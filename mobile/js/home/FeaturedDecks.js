import React, { Fragment } from 'react';
import { AppUpdateNotice } from '../components/AppUpdateNotice';
import { DecksFeed } from '../components/DecksFeed';
import { EmptyFeed } from './EmptyFeed';
import { useLazyQuery, gql } from '@apollo/client';
import { useNavigation, useFocusEffect } from '../ReactNavigation';

import * as Constants from '../Constants';

const REFETCH_FEED_INTERVAL_MS = 60 * 60 * 1000;

export const FeaturedDecks = ({ focused, deckId }) => {
  const { navigate } = useNavigation();
  const [lastFetched, setLastFetched] = React.useState({
    time: undefined,
  });
  const [decks, setDecks] = React.useState(undefined);
  const [error, setError] = React.useState(undefined);
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
      if (
        (!lastFetched.time || Date.now() - lastFetched.time > REFETCH_FEED_INTERVAL_MS) &&
        deckId === undefined
      ) {
        onRefresh();
      }
    }, [lastFetched.time, deckId, onRefresh])
  );

  React.useEffect(() => {
    if (query.called && !query.loading) {
      if (query.data) {
        setDecks(query.data.featuredFeed);
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
          onPressDeck={({ deckId }) =>
            navigate('HomeScreen', {
              deckId,
            })
          }
          refreshing={!!(lastFetched.time && query.loading && decks?.length)}
          onRefresh={onRefresh}
        />
      )}
      <AppUpdateNotice />
    </Fragment>
  );
};
