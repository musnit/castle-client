import * as React from 'react';
import { Pressable, StyleSheet, Text, View, Linking } from 'react-native';
import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';

const PARTY_URL = 'https://castle.xyz/halloween';

const PARTY_START = new Date('2021-10-27T09:00:00.000-07:00');
const PARTY_END = new Date('2021-10-31T23:59:00.000-07:00');

const isBeforeParty = PARTY_START - new Date() > 0;
export const isDuringParty = PARTY_START - new Date() < 0 && PARTY_END - new Date() > 0;
const isAfterParty = PARTY_END - new Date() < 0;

let daysLeft = 0;
const diff = (PARTY_START - new Date()) / 1000;
if (diff > 0) {
  daysLeft = Math.round(diff / (60 * 60 * 24));
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
  },
  candle: {
    width: 36,
    height: 36,
  },
  banner: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  center: {
    padding: 16,
    alignItems: 'center',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  counterNumber: {
    color: '#7CFC9C',
    fontFamily: 'Basteleur-Bold',
    fontSize: 64,
    marginVertical: -12,
    marginRight: 12,
  },
  counterText: {
    color: '#7CFC9C',
    fontFamily: 'Basteleur-Bold',
    fontSize: 18,
    lineHeight: 24,
    textTransform: 'uppercase',
  },
  body: {
    color: '#7CFC9C',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E74AE8',
    borderRadius: 4,
  },
  buttonLabel: {
    color: '#E74AE8',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  date: {
    flex: 1,
    textAlign: 'center',
    color: '#7CFC9C',
    fontFamily: 'Basteleur-Bold',
    textTransform: 'uppercase',
    fontSize: 14,
    letterSpacing: 1,
  },
});

export const HalloweenPromo = () => {
  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <FastImage
          style={styles.candle}
          source={require('../../assets/images/halloween/candle.png')}
        />
        <FastImage
          resizeMode={'contain'}
          style={{ flex: 1, height: 27 }}
          source={require('../../assets/images/halloween/logo.png')}
        />
        <FastImage
          style={styles.candle}
          source={require('../../assets/images/halloween/candle.png')}
        />
      </View>
      <View style={styles.center}>
        <FastImage
          resizeMode={'contain'}
          style={{ width: '95%', height: 60 }}
          source={require('../../assets/images/halloween/halloweenparty.png')}
        />

        <View style={styles.counter}>
          {isBeforeParty ? (
            <>
              <Text style={styles.counterNumber}>{daysLeft}</Text>
              <View>
                <Text style={styles.counterText}>day{daysLeft === 1 ? '' : 's'} until</Text>
                <Text style={styles.counterText}>the party</Text>
              </View>
            </>
          ) : null}
          {isDuringParty ? <Text style={styles.counterText}>Happening now!</Text> : null}
          {isAfterParty ? <Text style={styles.counterText}>Rest in Peace</Text> : null}
        </View>

        <View>
          {isBeforeParty || isDuringParty ? (
            <Text style={styles.body}>
              We’re hanging out on the internet,{'\n'}
              making spooky art and games together.{'\n'}
              Make something and get a cool gift!
            </Text>
          ) : null}
          {isAfterParty ? (
            <Text style={styles.body}>
              Thank you to everyone who participated!{'\n'}
              Until next year...
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Pressable
            style={[styles.button, { marginRight: 16 }]}
            onPress={() => Linking.openURL(PARTY_URL)}>
            <Text style={styles.buttonLabel}>Learn More</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() => Linking.openURL(Constants.DISCORD_INVITE_LINK)}>
            <Text style={styles.buttonLabel}>Join Discord</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.banner}>
        <FastImage
          style={styles.candle}
          source={require('../../assets/images/halloween/candle.png')}
        />
        <Text style={styles.date}>October 27–31, 2021</Text>
        <FastImage
          style={styles.candle}
          source={require('../../assets/images/halloween/candle.png')}
        />
      </View>
    </View>
  );
};
