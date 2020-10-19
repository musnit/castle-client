import React, { Fragment } from 'react';
import { StatusBar, View, Text, Linking, StyleSheet } from 'react-native';
import { DecksGrid } from '../components/DecksGrid';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect, useScrollToTop } from '../ReactNavigation';
import gql from 'graphql-tag';
import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';

const REFETCH_FEED_INTERVAL_MS = 60 * 60 * 1000;

const styles = StyleSheet.create({
  promoContainer: {
    padding: 24,
    borderBottomWidth: 1,
    borderColor: Constants.colors.grayOnBlackBorder,
    alignItems: 'center',
  },
  promoText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  promoTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoDate: {
    fontWeight: 'bold',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
});

const Halloween2020Promo = () => {
  return (
    <View style={styles.promoContainer}>
      <View style={styles.promoTitle}>
        <Text style={{ fontSize: 24 }}>🎃</Text>
        <FastImage
          style={{ height: 24, aspectRatio: 7.9, marginHorizontal: 12 }}
          source={require('../../assets/images/Halloween2020Promo.png')}
        />
        <Text style={{ fontSize: 24 }}>🎃</Text>
      </View>
      <Text style={[styles.promoText, styles.promoDate]}>
        <Text>THIS WEEK&nbsp;&nbsp;/&nbsp;&nbsp;WED&thinsp;–&thinsp;SUN</Text>
      </Text>
      <Text style={styles.promoText}>
        hang&nbsp;out • make&nbsp;spooky&nbsp;art • get&nbsp;cool&nbsp;gifts
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
        <View style={[Constants.styles.primaryButton, { marginRight: 16 }]}>
          <Text
            style={Constants.styles.primaryButtonLabel}
            onPress={() => Linking.openURL('https://castle.xyz/halloween')}>
            Read more
          </Text>
        </View>
        <Text style={{ color: '#fff' }}>~ IF YOU DARE ~</Text>
      </View>
    </View>
  );
};

export const FeaturedDecks = ({ focused }) => {
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
      <Halloween2020Promo />
      <DecksGrid
        decks={decks}
        scrollViewRef={scrollViewRef}
        onPressDeck={(deck, index) =>
          navigate(
            'PlayDeck',
            {
              decks,
              initialDeckIndex: index,
              title: 'Featured',
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
