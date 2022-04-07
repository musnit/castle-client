import * as React from 'react';
import { StatusBar, ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import { ExploreRow, SkeletonExploreRow } from './ExploreRow';
import { useFocusEffect, useNavigation, useScrollToTop } from '../ReactNavigation';
import * as Analytics from '../common/Analytics';

import { useLazyQuery, gql } from '@apollo/client';

import * as Constants from '../Constants';
import FastImage from 'react-native-fast-image';

const REFETCH_FEED_INTERVAL_MS = 60 * 1000;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  feedbackRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedbackLabel: {
    fontSize: 16,
    color: Constants.colors.white,
  },
});

const FeedbackPromptRow = ({ onPress }) => {
  return (
    <View style={styles.feedbackRow}>
      <FastImage
        style={{ width: 26, height: 30 }}
        source={require('../../assets/images/emoji/chair-white.png')}
      />
      <View style={{ paddingHorizontal: 16, flex: 1 }}>
        <Text style={styles.feedbackLabel}>How can we make Castle better?</Text>
      </View>
      <TouchableOpacity style={Constants.styles.primaryButton} onPress={onPress}>
        <Text style={Constants.styles.primaryButtonLabel}>Leave feedback</Text>
      </TouchableOpacity>
    </View>
  );
};

export const ExploreScreen = ({ route }) => {
  const { push } = useNavigation();

  const [lastFetchedTime, setLastFetchedTime] = React.useState(null);
  const [feeds, setFeeds] = React.useState(undefined);
  const [fetchFeeds, query] = useLazyQuery(
    gql`
      query exploreFeed {
        exploreFeeds(apiVersion: 2) {
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
      Analytics.logEvent('VIEW_EXPLORE');
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
      // hackily splice in feedback row sentinel amidst regular feeds
      let feeds = [...query.data.exploreFeeds];
      if (feeds && feeds.length >= 2) {
        feeds.splice(2, 0, { isFeedbackRow: true });
      } else {
        feeds = feeds || [];
        feeds.push({ isFeedbackRow: true });
      }
      setFeeds(feeds);
      setPreloadSearchResults(query.data.exploreSearch);
    }
  }, [query.called, query.loading, query.error, query.data]);

  const onStartSearch = React.useCallback(() => setIsSearching(true), []);
  const onCancelSearch = React.useCallback(() => {
    setIsSearching(false);
    setSearchQuery(undefined);
  }, []);
  const onChangeSearchQuery = React.useCallback((text) => setSearchQuery(text), []);

  const onPressFeedback = React.useCallback(() => push('Feedback'), [push]);

  const scrollViewRef = React.useRef();
  useScrollToTop(scrollViewRef);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.tabTitle}>
        {!isSearching ? <Text style={styles.tabTitleText}>Explore</Text> : null}
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
        <ScrollView ref={scrollViewRef}>
          {!feeds && (
            <>
              <SkeletonExploreRow />
              <SkeletonExploreRow />
              <SkeletonExploreRow />
            </>
          )}
          {feeds &&
            feeds.map((feed, i) => {
              if (feed.isFeedbackRow) {
                return <FeedbackPromptRow key={`feedback-${i}`} onPress={onPressFeedback} />;
              } else {
                return (
                  <ExploreRow
                    feed={feed}
                    key={feed.feedId}
                    last={i === feeds.length - 1 ? true : false}
                  />
                );
              }
            })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
