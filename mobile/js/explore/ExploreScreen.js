import * as React from 'react';
import { StatusBar, StyleSheet, Linking, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import { useFocusEffect, useNavigation } from '../ReactNavigation';

import * as Amplitude from 'expo-analytics-amplitude';

import { SpringPartyCountdown } from './SpringParty';

const styles = StyleSheet.create({});

export const ExploreScreen = ({ route }) => {
  useNavigation();

  const [isSearching, setIsSearching] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState(undefined);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Amplitude.logEvent('VIEW_EXPLORE');
    })
  );

  const onStartSearch = React.useCallback(() => setIsSearching(true), []);
  const onCancelSearch = React.useCallback(() => setIsSearching(false), []);
  const onChangeSearchQuery = React.useCallback((text) => setSearchQuery(text), []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SearchInput
        onFocus={onStartSearch}
        onCancel={onCancelSearch}
        value={searchQuery}
        onChangeText={onChangeSearchQuery}
      />
      {isSearching ? <SearchResults query={searchQuery} /> : <SpringPartyCountdown />}
    </SafeAreaView>
  );
};
