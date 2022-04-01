import * as React from 'react';
import { Animated, StatusBar, StyleSheet, View } from 'react-native';
import { CommentsSheet } from '../comments/CommentsSheet';
import { FeaturedDecks } from './FeaturedDecks';
import { PopoverProvider } from '../components/PopoverProvider';
import { RecentDecks } from './RecentDecks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SegmentedNavigation } from '../components/SegmentedNavigation';
import { useSession } from '../Session';
import { useFocusEffect, useNavigation } from '../ReactNavigation';
import * as PushNotifications from '../PushNotifications';
import * as Analytics from '../common/Analytics';

import * as Constants from '../Constants';

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
    paddingBottom: 12,
  },
  elevatedHeader: {
    position: 'absolute',
    width: '100%',
    zIndex: 1,
    elevation: 1,
    height: Constants.FEED_HEADER_HEIGHT,
    left: 0,
  },
});

const makeItems = ({ newFollowingDecks, isAnonymous } = {}) => {
  let items = [
    {
      name: 'Featured',
      value: 'featured',
      item: (props) => <FeaturedDecks {...props} />,
    },
    {
      name: 'History',
      value: 'recent',
      item: (props) => <RecentDecks {...props} />,
    },
  ];

  /* if (!isAnonymous) {
    items.splice(1, 0, {
      name: 'Following',
      value: 'following',
      indicator: newFollowingDecks,
      item: (props) => <FollowingDecks {...props} />,
    });
  } */

  return items;
};

export const HomeScreen = ({ route }) => {
  useNavigation();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = React.useState('featured');
  const { newFollowingDecks, isAnonymous } = useSession();
  const [items, setItems] = React.useState(makeItems());

  // play a deck within the feed?
  let deckId;
  let deepLinkDeckId;
  if (route?.params) {
    deckId = route.params.deckId;
    deepLinkDeckId = route.params.deepLinkDeckId;
  }

  React.useEffect(
    () => setItems(makeItems({ newFollowingDecks, isAnonymous })),
    [newFollowingDecks, isAnonymous]
  );

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Analytics.logEvent('VIEW_HOME', { mode });
    }, [mode])
  );

  const selectedItem = items.find((item) => item.value === mode);

  // animate hide header when deck is played
  const headerY = React.useRef(
    new Animated.Value(deckId ? -(Constants.FEED_HEADER_HEIGHT + insets.top) : 0)
  ).current;
  React.useEffect(() => {
    const toValue = deckId ? -(Constants.FEED_HEADER_HEIGHT + insets.top) : 0;
    Animated.spring(headerY, { toValue, ...SPRING_CONFIG }).start();
  }, [deckId]);

  const [commentsState, setCommentsState] = React.useReducer(
    (state, action) => {
      if (action.type === 'open') {
        return {
          isOpen: true,
          deck: action.deck,
        };
      }
      if (action.type === 'close') {
        return {
          ...state,
          isOpen: false,
        };
      }
    },
    {
      isOpen: false,
      deckId: null,
    }
  );
  const openComments = React.useCallback(
    ({ deck }) => setCommentsState({ type: 'open', deck }),
    []
  );
  const closeComments = React.useCallback(() => setCommentsState({ type: 'close' }), []);

  React.useEffect(() => {
    // request permissions and token for push notifs when the home tab is first viewed.
    // whether they accept or deny, subsequent calls to this method won't pop up anything for
    // the user.
    PushNotifications.requestTokenAsync();
  }, []);

  return (
    <View style={styles.container}>
      <PopoverProvider>
        {selectedItem.item({
          deckId,
          onPressComments: openComments,
          onCloseComments: closeComments,
          isCommentsOpen: commentsState.isOpen,
          deepLinkDeckId,
        })}
        <CommentsSheet
          isFullScreen={!!deckId}
          isOpen={commentsState.isOpen}
          onClose={closeComments}
          deck={commentsState.deck}
        />
      </PopoverProvider>
    </View>
  );
};
