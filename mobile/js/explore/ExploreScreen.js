import * as React from 'react';
import { StatusBar, ScrollView, View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import { ExploreRow, SkeletonExploreRow } from './ExploreRow';
import { useFocusEffect, useNavigation } from '../ReactNavigation';

import { useLazyQuery, gql } from '@apollo/client';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';

const REFETCH_FEED_INTERVAL_MS = 60 * 1000;

const styles = StyleSheet.create({
  tabTitle: {
    height: 64,
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
    flexDirection: 'row',
  },
  tabTitleText: {
    fontSize: 32,
    lineHeight: 36,
    fontFamily: 'Basteleur-Bold',
    color: '#fff',
    flex: 1,
  },
  tabTitleAction: {
    flex: 0,
  },
});

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
        exploreSearch(text: "") {
          users {
            id
            userId
            username
            photo {
              url
            }
          }
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  const [isSearching, setIsSearching] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState();

  // preload a set of search results that display right when you focus the search bar
  const [preloadSearchResults, setPreloadSearchResults] = React.useState();

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Amplitude.logEvent('VIEW_EXPLORE');
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    fetchFeeds();
    setLastFetchedTime(Date.now());
  }, [fetchFeeds, setLastFetchedTime]);

  useFocusEffect(
    React.useCallback(() => {
      if (!lastFetchedTime || Date.now() - lastFetchedTime > REFETCH_FEED_INTERVAL_MS) {
        onRefresh();
      }
    }, [lastFetchedTime, onRefresh])
  );

  React.useEffect(() => {
    if (query.called && !query.loading && !query.error && query.data) {
      setFeeds(query.data.exploreFeeds);
      setPreloadSearchResults(query.data.exploreSearch);
    }
  }, [query.called, query.loading, query.error, query.data]);

  const onStartSearch = React.useCallback(() => setIsSearching(true), []);
  const onCancelSearch = React.useCallback(() => {
    setIsSearching(false);
    setSearchQuery(undefined);
  }, []);
  const onChangeSearchQuery = React.useCallback((text) => setSearchQuery(text), []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={styles.tabTitle}>
        {!isSearching ? (
          <Text style={styles.tabTitleText}>Explore</Text>
        ) : null }
        <View style={[styles.tabTitleAction, isSearching ? { flex: 1 } : null]}>
          <SearchInput
            onFocus={onStartSearch}
            onCancel={onCancelSearch}
            value={searchQuery}
            onChangeText={onChangeSearchQuery}
          />
        </View>
      </View>

      {isSearching ? (
        <SearchResults query={searchQuery} initialResults={preloadSearchResults} />
      ) : (
        <ScrollView>
          {!feeds && (
            <>
              <SkeletonExploreRow />
              <SkeletonExploreRow />
              <SkeletonExploreRow />
            </>
          )}
          {feeds && feeds.map((feed, i) => <ExploreRow feed={feed} key={feed.feedId} last={(i === feeds.length - 1) ? true : false} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
