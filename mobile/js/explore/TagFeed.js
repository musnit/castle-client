import React from 'react';
import { DecksGrid } from '../components/DecksGrid';
import { useLazyQuery, gql } from '@apollo/client';
import { useNavigation, useFocusEffect, useScrollToTop } from '../ReactNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';

import * as Analytics from '../common/Analytics';
import * as Constants from '../Constants';

export const TagFeed = ({ route }) => {
  const tag = route?.params.tag;
  const title = `#${tag}`;

  const { navigate } = useNavigation();

  const [lastFetched, setLastFetched] = React.useState({
    time: undefined,
    lastDeckId: undefined,
  });
  const [lastQueryData, setLastQueryData] = React.useState(null);
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
      query ($tag: String!, $lastModifiedBefore: Datetime) {
        decksForTag(tag: $tag, lastModifiedBefore: $lastModifiedBefore) {
          ${Constants.FEED_ITEM_DECK_FRAGMENT}
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  const onRefresh = React.useCallback(
    (lastDeck) => {
      fetchDecks({
        variables: {
          tag,
          lastModifiedBefore: lastDeck?.lastModified,
        },
      });
      setLastFetched({ time: Date.now(), lastDeckId: lastDeck?.deckId });
    },
    [fetchDecks, setLastFetched, tag]
  );

  React.useEffect(onRefresh, [tag]);

  useFocusEffect(
    React.useCallback(() => {
      Analytics.logEventSkipAmplitude('VIEW_TAG_FEED', { tag });
    }, [tag])
  );

  const onEndReached = React.useCallback(() => {
    if (!query.loading && decks?.length) {
      const lastDeck = decks[decks.length - 1];
      onRefresh(lastDeck);
    }
  }, [query.loading, decks, onRefresh]);

  React.useEffect(() => {
    if (query.called && !query.loading && !query.error && query.data) {
      // Without this, both "set" and "appent" get called every time a new page is loaded
      if (lastQueryData == query.data) {
        return;
      }
      setLastQueryData(query.data);

      const decks = query.data.decksForTag;
      if (decks.length > 0) {
        if (lastFetched.lastDeckId && decks[decks.length - 1].deckId !== lastFetched.lastDeckId) {
          // append next page
          changeDecks({ type: 'append', decks });
        } else {
          // clean refresh
          changeDecks({ type: 'set', decks });
        }
      }
    }
  }, [lastQueryData, query.called, query.loading, query.error, query.data, lastFetched.lastDeckId]);

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
          onEndReachedThreshold={2}
          onPressDeck={(deck, index) =>
            navigate(
              'PlayDeck',
              {
                decks,
                initialDeckIndex: index,
                title,
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
