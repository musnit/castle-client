import * as React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { FeaturedDecks } from './FeaturedDecks';
import { FollowingDecks } from './FollowingDecks';
import { NewestDecks } from './NewestDecks';
import { RecentDecks } from './RecentDecks';
import { useSafeArea } from 'react-native-safe-area-context';
import { SegmentedNavigation } from '../components/SegmentedNavigation';
import { useFocusEffect } from '@react-navigation/native';

import * as Amplitude from 'expo-analytics-amplitude';
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
    name: 'Featured',
    value: 'featured',
    item: () => <FeaturedDecks />,
  },
  {
    name: 'Following',
    value: 'following',
    item: () => <FollowingDecks />,
  },
  {
    name: 'New',
    value: 'newest',
    item: () => <NewestDecks />,
  },
  {
    name: 'History',
    value: 'recent',
    item: () => <RecentDecks />,
  },
];

export const HomeScreen = () => {
  const insets = useSafeArea();
  const [mode, setMode] = React.useState(MODE_ITEMS[0].value);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Constants.Android && StatusBar.setTranslucent(true); // needed for tab navigator
    }, [])
  );

  React.useEffect(() => {
    Amplitude.logEventWithProperties('VIEW_HOME', { mode });
  }, [mode]);

  const selectedItem = MODE_ITEMS.find((item) => item.value === mode);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <SegmentedNavigation
          items={MODE_ITEMS}
          selectedItem={selectedItem}
          onSelectItem={(item) => setMode(item.value)}
        />
      </View>
      {selectedItem.item()}
    </View>
  );
};
