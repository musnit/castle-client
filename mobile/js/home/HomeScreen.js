import * as React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { NewestDecks } from './NewestDecks';
import { useSafeArea } from 'react-native-safe-area-context';
import { SegmentedNavigation } from '../components/SegmentedNavigation';
import { useFocusEffect } from '@react-navigation/native';

import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Constants.colors.black,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: Constants.colors.grayOnBlackBorder,
    paddingTop: 16,
  },
});

const MODE_ITEMS = [
  {
    name: 'Newest',
    value: 'newest',
  },
];

export const HomeScreen = () => {
  const insets = useSafeArea();

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Constants.Android && StatusBar.setTranslucent(true); // needed for tab navigator
    }, [])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <SegmentedNavigation
          items={MODE_ITEMS}
          selectedItem={MODE_ITEMS[0]}
          onSelectItem={() => {}}
        />
      </View>
      <NewestDecks />
    </View>
  );
};
