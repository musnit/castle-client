import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useListen } from './ghost/GhostEvents';

import PlayDeckNavigator from './PlayDeckNavigator';

import * as Constants from './Constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  deck: {
    width: '100%',
    aspectRatio: Constants.CARD_RATIO,
    borderRadius: 6,
  },
});

const PlayDeckScreen = (props) => {
  const { popToTop } = useNavigation();
  if (Constants.Android) {
    // after the game loads, it listens for keyboard events and
    // causes react native's back button event to fail
    useListen({
      eventName: 'CASTLE_SYSTEM_BACK_BUTTON',
      handler: popToTop,
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.deck}>
        <PlayDeckNavigator {...props} />
      </View>
    </View>
  );
};

export default PlayDeckScreen;
