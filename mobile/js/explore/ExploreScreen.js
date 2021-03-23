import * as React from 'react';
import { StatusBar, StyleSheet, Linking, Text, TouchableOpacity, View } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '../ReactNavigation';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';
import Viewport from '../common/viewport';

import FastImage from 'react-native-fast-image';

const SPRING_PARTY_URL = 'https://castle.xyz/spring_party';

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
});

const SpringPartyCountdown = () => {
  const insets = useSafeArea();
  const start = new Date('2021-03-28T23:59:00');

  const formatNum = (num) => {
    return ('0' + num).slice(-2);
  };

  const calculateTimeLeft = () => {
    const diff = (start - new Date()) / 1000;
    let timetoParty = {};

    if (diff > 0) {
      timetoParty = {
        days: Math.floor(diff / (60 * 60 * 24)),
        hours: Math.floor((diff / (60 * 60)) % 24),
        minutes: Math.floor((diff / 60) % 60),
        seconds: Math.floor(diff % 60),
      };
    }

    return timetoParty;
  };

  const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
  });

  return (
    <View
      style={{
        ...Constants.styles.container,
        paddingTop: insets.top,
      }}>
      <View
        style={{
          ...styles.springContainer,
          paddingVertical: -120 * Viewport.aspectRatio + 77 + '%',
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
          {timeLeft ? (
            <View style={styles.countdown}>
              <View style={styles.countdownNumWrapper}>
                <Text style={styles.countdownNum}>{formatNum(timeLeft.days)}</Text>
                <Text style={styles.springText}>Days</Text>
              </View>
              <Text style={[styles.countdownNum, styles.countdownNumColon]}>:</Text>
              <View style={styles.countdownNumWrapper}>
                <Text style={styles.countdownNum}>{formatNum(timeLeft.hours)}</Text>
                <Text style={styles.springText}>Hours</Text>
              </View>
              <Text style={[styles.countdownNum, styles.countdownNumColon]}>:</Text>
              <View style={styles.countdownNumWrapper}>
                <Text style={styles.countdownNum}>{formatNum(timeLeft.minutes)}</Text>
                <Text style={styles.springText}>Minutes</Text>
              </View>
              <Text style={[styles.countdownNum, styles.countdownNumColon]}>:</Text>
              <View style={styles.countdownNumWrapper}>
                <Text style={styles.countdownNum}>{formatNum(timeLeft.seconds)}</Text>
                <Text style={styles.springText}>Seconds</Text>
              </View>
            </View>
          ) : null}
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
    </View>
  );
};

export const ExploreScreen = ({ route }) => {
  useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Amplitude.logEventWithProperties('VIEW_EXPLORE');
    })
  );

  return <SpringPartyCountdown />;
};
