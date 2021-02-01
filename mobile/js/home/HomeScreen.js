import * as React from 'react';
import { Animated, StatusBar, StyleSheet, Text, View } from 'react-native';
import { FeaturedDecks } from './FeaturedDecks';
import { FollowingDecks } from './FollowingDecks';
import { NewestDecks } from './NewestDecks';
import { PopoverProvider } from '../components/PopoverProvider';
import { RecentDecks } from './RecentDecks';
import { useSafeArea } from 'react-native-safe-area-context';
import { SegmentedNavigation } from '../components/SegmentedNavigation';
import { useSession } from '../Session';
import { useFocusEffect, useNavigation } from '../ReactNavigation';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';

const HEADER_HEIGHT = 56;

const SPRING_CONFIG = {
  tension: 150,
  friction: 50,
  overshootClamping: true,
  restDisplacementThreshold: 1,
  restSpeedThreshold: 1,
  useNativeDriver: true,
};

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
    backgroundColor: '#000',
  },
  elevatedHeader: {
    position: 'absolute',
    width: '100%',
    zIndex: 1,
    elevation: 1,
    height: HEADER_HEIGHT,
    left: 0,
  },
});

const makeItems = ({ newFollowingDecks } = {}) => [
  {
    name: 'Featured',
    value: 'featured',
    item: (props) => <FeaturedDecks {...props} />,
  },
  {
    name: 'Following',
    value: 'following',
    indicator: newFollowingDecks,
    item: (props) => <FollowingDecks {...props} />,
  },
  {
    name: 'New',
    value: 'newest',
    item: (props) => <NewestDecks {...props} />,
  },
  {
    name: 'History',
    value: 'recent',
    item: (props) => <RecentDecks {...props} />,
  },
];

export const HomeScreen = ({ route }) => {
  useNavigation();
  const insets = useSafeArea();
  const [mode, setMode] = React.useState('featured');
  const { newFollowingDecks } = useSession();
  const [items, setItems] = React.useState(makeItems());

  // play a deck within the feed?
  let deckId;
  if (route?.params) {
    deckId = route.params.deckId;
  }

  React.useEffect(() => setItems(makeItems({ newFollowingDecks })), [newFollowingDecks]);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
    }, [])
  );

  React.useEffect(() => {
    Amplitude.logEventWithProperties('VIEW_HOME', { mode });
  }, [mode]);

  const selectedItem = items.find((item) => item.value === mode);

  // animate hide header when deck is played
  const headerY = React.useRef(new Animated.Value(deckId ? -(HEADER_HEIGHT + insets.top) : 0))
    .current;
  React.useEffect(() => {
    const toValue = deckId ? -(HEADER_HEIGHT + insets.top) : 0;
    Animated.spring(headerY, { toValue, ...SPRING_CONFIG }).start();
  }, [deckId]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View
        style={[
          styles.header,
          styles.elevatedHeader,
          { top: insets.top, transform: [{ translateY: headerY }] },
        ]}>
        <SegmentedNavigation
          items={items}
          selectedItem={selectedItem}
          onSelectItem={(item) => setMode(item.value)}
        />
      </Animated.View>
      <PopoverProvider>{selectedItem.item({ deckId })}</PopoverProvider>
    </View>
  );
};
