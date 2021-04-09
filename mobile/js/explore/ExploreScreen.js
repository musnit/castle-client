import * as React from 'react';
import { StatusBar, StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import { ExploreRow } from './ExploreRow';
import { useFocusEffect, useNavigation } from '../ReactNavigation';

import { useLazyQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as Amplitude from 'expo-analytics-amplitude';

import * as Constants from '../Constants';

const REFETCH_FEED_INTERVAL_MS = 60 * 1000;

export const ExploreScreen = ({ route }) => {
  useNavigation();

  const [lastFetchedTime, setLastFetchedTime] = React.useState(null);
  const [feeds, setFeeds] = React.useState(undefined);
  const [fetchFeeds, query] = useLazyQuery(
    gql`
        query exploreFeed {
        exploreFeeds {
            title
            feedId
            decks {
              ${Constants.FEED_ITEM_DECK_FRAGMENT}
            }
        }
        }
    `,
    { fetchPolicy: 'no-cache' }
  );

  const [isSearching, setIsSearching] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState(undefined);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Amplitude.logEvent('VIEW_EXPLORE');
    })
  );

  const onRefresh = React.useCallback(() => {
    fetchFeeds();
    setLastFetchedTime(Date.now());
  }, [fetchFeeds, setLastFetchedTime]);

  useFocusEffect(onRefresh);
  useFocusEffect(
    React.useCallback(() => {
      if (!lastFetchedTime || Date.now() - lastFetchedTime > REFETCH_FEED_INTERVAL_MS) {
        onRefresh();
      }
    }),
    [lastFetchedTime]
  );

  React.useEffect(() => {
    if (query.called && !query.loading && !query.error && query.data) {
      setFeeds(query.data.exploreFeeds);
    }
  }, [query.called, query.loading, query.error, query.data]);

  const onStartSearch = React.useCallback(() => setIsSearching(true), []);
  const onCancelSearch = React.useCallback(() => setIsSearching(false), []);
  const onChangeSearchQuery = React.useCallback((text) => setSearchQuery(text), []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SearchInput
        onFocus={onStartSearch}
        onCancel={onCancelSearch}
        value={searchQuery}
        onChangeText={onChangeSearchQuery}
      />
      {isSearching ? (
        <SearchResults query={searchQuery} />
      ) : (
        <ScrollView>
          {feeds && feeds.map((feed) => <ExploreRow feed={feed} key={feed.feedId} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
