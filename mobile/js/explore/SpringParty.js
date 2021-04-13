import * as React from 'react';
import { StyleSheet, Linking, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';

import * as Constants from '../Constants';
import Viewport from '../common/viewport';

import { DecksGrid } from '../components/DecksGrid';
import { EmptyFeed } from '../home/EmptyFeed';
import { useLazyQuery, gql } from '@apollo/client';
import { isTablet } from 'react-native-device-info';
import FastImage from 'react-native-fast-image';
import { useNavigation, useFocusEffect, useScrollToTop } from '../ReactNavigation';

const SPRING_PARTY_URL = 'https://castle.xyz/spring_party';
const REFETCH_FEED_INTERVAL_MS = 60 * 1000;

const PARTY_START = new Date('2021-03-31T09:00:00.000-07:00');
const PARTY_END = new Date('2021-04-04T23:59:00.000-07:00');

const styles = StyleSheet.create({
  springContainer: {
    alignItems: 'stretch',
    justifyContent: 'space-between',
    flex: 1,
  },
  springLogo: {
    width: 318,
    height: 172,
    marginVertical: 16,
    alignItems: 'center',
    textAlign: 'center',
  },
  springLogoSmall: {
    width: 185,
    height: 100,
    marginVertical: 16,
  },
  springText: {
    fontFamily: 'Times New Roman',
    fontStyle: 'italic',
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  springSubtitle: {
    fontFamily: 'Times New Roman',
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  countdownNum: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
    width: 80,
    textAlign: 'center',
  },
  countdownNumColon: {
    marginBottom: 22,
    width: 'auto',
  },
  springFeedHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  springFeedFooter: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  springEmptyFeed: {
    paddingTop: Constants.GRID_PADDING,
    paddingLeft: Constants.GRID_PADDING,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyCell: {
    width: '33%',
    paddingRight: Constants.GRID_PADDING,
    paddingBottom: Constants.GRID_PADDING,
  },
  emptyCellInner: {
    aspectRatio: Constants.CARD_RATIO,
    borderRadius: Constants.CARD_SMALL_BORDER_RADIUS,
    backgroundColor: '#222',
  },
});

export const SpringDecks = () => {
  const isPartyHappening = PARTY_END - new Date() > 0;

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
      query EventFeed {
        eventFeed {
          ${Constants.FEED_ITEM_DECK_FRAGMENT}
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  const onRefresh = React.useCallback(
    (lastModifiedBefore) => {
      fetchDecks();
      setLastFetched({ time: Date.now(), lastModifiedBefore });
    },
    [fetchDecks, setLastFetched]
  );

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
      changeDecks({ type: 'set', decks: query.data.eventFeed });
    }
  }, [query.called, query.loading, query.error, query.data]);

  const scrollViewRef = React.useRef(null);
  useScrollToTop(scrollViewRef);

  const ListHeaderComponent = (
    <View style={styles.springFeedHeader}>
      <FastImage
        style={styles.springLogoSmall}
        source={require('../../assets/images/spring-party.png')}
      />
      {isPartyHappening ? (
        <>
          <Text style={styles.springText}>Happening now till April 4th!</Text>
          <Text style={styles.springText}>
            Create a deck during the party to have it appear here:
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.springText}>March 31st - April 4th 2021</Text>
          <Text style={styles.springText}>Check out the decks created during the party:</Text>
        </>
      )}
    </View>
  );

  const ListFooterComponent = (
    <View style={styles.springFeedFooter}>
      <Text style={{ ...styles.springText, marginBottom: 8 }}>Come hang out in our Discord:</Text>
      <TouchableOpacity
        style={Constants.styles.primaryButton}
        onPress={() => Linking.openURL(Constants.DISCORD_INVITE_LINK)}>
        <Text style={[Constants.styles.primaryButtonLabel, Constants.styles.buttonLabel]}>
          Join Discord
        </Text>
      </TouchableOpacity>
    </View>
  );

  return decks?.length ? (
    <DecksGrid
      decks={decks}
      scrollViewRef={scrollViewRef}
      refreshing={query.loading}
      onRefresh={onRefresh}
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
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
    />
  ) : (
    <ScrollView>
      {ListHeaderComponent}
      <View style={styles.springEmptyFeed}>
        <View style={styles.emptyCell}>
          <View style={styles.emptyCellInner} />
        </View>
        <View style={styles.emptyCell}>
          <View style={styles.emptyCellInner} />
        </View>
        <View style={styles.emptyCell}>
          <View style={styles.emptyCellInner} />
        </View>
        <View style={styles.emptyCell}>
          <View style={styles.emptyCellInner} />
        </View>
        <View style={styles.emptyCell}>
          <View style={styles.emptyCellInner} />
        </View>
        <View style={styles.emptyCell}>
          <View style={styles.emptyCellInner} />
        </View>
      </View>
      {ListFooterComponent}
    </ScrollView>
  );
};

const formatNum = (num) => {
  return ('0' + num).slice(-2);
};

const getTimeToParty = () => {
  const diff = (PARTY_START - new Date()) / 1000;
  let timeLeft = {};

  if (diff > 0) {
    timeLeft = {
      days: Math.floor(diff / (60 * 60 * 24)),
      hours: Math.floor((diff / (60 * 60)) % 24),
      minutes: Math.floor((diff / 60) % 60),
      seconds: Math.floor(diff % 60),
    };
  }

  return timeLeft;
};

export const SpringPartyCountdown = () => {
  const insets = useSafeArea();
  const hasPartyStarted = PARTY_START - new Date() < 0;
  const [timeToParty, setTimeToParty] = React.useState(getTimeToParty());

  React.useEffect(() => {
    if (!hasPartyStarted) {
      const timer = setTimeout(() => {
        setTimeToParty(getTimeToParty());
      }, 1000);
      return () => clearTimeout(timer);
    }
  });

  const countdown = (
    <View
      style={{
        ...styles.springContainer,
        paddingVertical: isTablet() ? '30%' : -120 * Viewport.aspectRatio + 77 + '%',
      }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.springText}>The honor of your presence</Text>
        <Text style={styles.springText}>is requested at the forthcoming...</Text>
        <FastImage
          style={styles.springLogo}
          source={require('../../assets/images/spring-party.png')}
        />
        <Text style={styles.springSubtitle}>Come hang out and make art and games.</Text>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.springText}>The party starts in:</Text>
        <View style={styles.countdown}>
          <View style={styles.countdownNumWrapper}>
            <Text style={styles.countdownNum}>{formatNum(timeToParty.days)}</Text>
            <Text style={styles.springText}>Days</Text>
          </View>
          <Text style={[styles.countdownNum, styles.countdownNumColon]}>:</Text>
          <View style={styles.countdownNumWrapper}>
            <Text style={styles.countdownNum}>{formatNum(timeToParty.hours)}</Text>
            <Text style={styles.springText}>Hours</Text>
          </View>
          <Text style={[styles.countdownNum, styles.countdownNumColon]}>:</Text>
          <View style={styles.countdownNumWrapper}>
            <Text style={styles.countdownNum}>{formatNum(timeToParty.minutes)}</Text>
            <Text style={styles.springText}>Minutes</Text>
          </View>
          <Text style={[styles.countdownNum, styles.countdownNumColon]}>:</Text>
          <View style={styles.countdownNumWrapper}>
            <Text style={styles.countdownNum}>{formatNum(timeToParty.seconds)}</Text>
            <Text style={styles.springText}>Seconds</Text>
          </View>
        </View>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.springText}>Get a head start by joining our Discord:</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
          <TouchableOpacity
            style={{ ...Constants.styles.secondaryButton, marginRight: 16 }}
            onPress={() => Linking.openURL(SPRING_PARTY_URL)}>
            <Text style={[Constants.styles.secondaryButtonLabel, Constants.styles.buttonLabel]}>
              Learn More
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={Constants.styles.primaryButton}
            onPress={() => Linking.openURL(Constants.DISCORD_INVITE_LINK)}>
            <Text style={[Constants.styles.primaryButtonLabel, Constants.styles.buttonLabel]}>
              Join Discord
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View
      style={{
        ...Constants.styles.container,
        paddingTop: insets.top,
      }}>
      {!hasPartyStarted && countdown}
      {hasPartyStarted && <SpringDecks />}
    </View>
  );
};
