import * as React from 'react';
import { StatusBar, StyleSheet, Linking, Text, TouchableOpacity, View } from 'react-native';

import { useFocusEffect, useNavigation } from '../ReactNavigation';

import * as Amplitude from 'expo-analytics-amplitude';

import { SpringPartyCountdown } from './SpringParty';

const styles = StyleSheet.create({});

export const ExploreScreen = ({ route }) => {
  useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Amplitude.logEvent('VIEW_EXPLORE');
    })
  );

  return <SpringPartyCountdown />;
};
