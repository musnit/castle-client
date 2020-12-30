import React, { Fragment } from 'react';
import { StatusBar, View, Text, Linking, StyleSheet, Platform } from 'react-native';
import { DecksFeed } from '../components/DecksFeed';
import { useQuery, useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect, useScrollToTop } from '../ReactNavigation';
import gql from 'graphql-tag';
import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';

const REFETCH_FEED_INTERVAL_MS = 60 * 60 * 1000;

const styles = StyleSheet.create({
  noticeContainer: {
    paddingVertical: 24,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
  },
  noticeHeadline: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  noticeText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    lineHeight: 22,
  },
});

const AppUpdateNotice = () => {
  const [updateInfo, setUpdateInfo] = React.useState({ isUpdateAvailable: false });
  const loadUpdateInfo = useQuery(
    gql`
      query {
        clientUpdateStatus {
          isUpdateAvailable
          link
        }
      }
    `
  );

  React.useEffect(() => {
    if (!loadUpdateInfo.loading && !loadUpdateInfo.error && loadUpdateInfo.data) {
      setUpdateInfo(loadUpdateInfo.data.clientUpdateStatus);
    }
  }, [loadUpdateInfo.loading, loadUpdateInfo.error, loadUpdateInfo.data]);

  if (!updateInfo.isUpdateAvailable || __DEV__) {
    return null;
  }
  return (
    <View style={styles.noticeContainer}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center' }}>
          <FastImage
            style={{ height: 28, aspectRatio: 1, marginRight: 12 }}
            source={require('../../assets/images/emoji/wand-white.png')}
          />
          <Text style={styles.noticeHeadline}>New version available</Text>
        </View>
        <View style={Constants.styles.primaryButton}>
          <Text
            style={Constants.styles.primaryButtonLabel}
            onPress={() => Linking.openURL(updateInfo.link)}>
            Update
          </Text>
        </View>
      </View>
      <Text style={styles.noticeText}>
        Update Castle when you have a moment, otherwise new decks won't work correctly!
      </Text>
    </View>
  );
};

export const FeaturedDecks = ({ focused, deckId }) => {
  const { navigate } = useNavigation();
  const [lastFetched, setLastFetched] = React.useState({
    time: undefined,
  });
  const [decks, setDecks] = React.useState(undefined);
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
      if (!lastFetched.time || Date.now() - lastFetched.time > REFETCH_FEED_INTERVAL_MS) {
        onRefresh();
      }
    }),
    [lastFetched.time]
  );

  React.useEffect(() => {
    if (query.called && !query.loading && !query.error && query.data) {
      setDecks(query.data.featuredFeed);
    }
  }, [query.called, query.loading, query.error, query.data]);

  const scrollViewRef = React.useRef(null);
  useScrollToTop(scrollViewRef);

  return (
    <Fragment>
      <AppUpdateNotice />
      <DecksFeed
        decks={decks}
        isPlaying={deckId !== undefined}
        scrollViewRef={scrollViewRef}
        onPressDeck={({ deckId }) =>
          navigate(
            'HomeScreen',
            {
              deckId,
            },
            {
              isFullscreen: true,
            }
          )
        }
        refreshing={!!(lastFetched.time && query.loading)}
        onRefresh={onRefresh}
      />
    </Fragment>
  );
};
