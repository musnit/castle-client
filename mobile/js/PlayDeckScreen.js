import React from 'react';
import { StyleSheet, View } from 'react-native';

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

const PlayDeckScreen = (props) => (
  <View style={styles.container}>
    <View style={styles.deck}>
      <PlayDeckNavigator {...props} />
    </View>
  </View>
);

export default PlayDeckScreen;
