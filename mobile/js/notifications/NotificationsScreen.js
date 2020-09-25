import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { NotificationBody } from './NotificationBody';
import { toRecentDate } from '../common/date-utilities';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import { useSafeArea } from 'react-native-safe-area-context';
import { UserAvatar } from '../components/UserAvatar';

import * as Constants from '../Constants';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.colors.black,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: Constants.colors.grayOnBlackBorder,
    paddingTop: 16,
  },
  sectionTitle: {
    color: Constants.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 8,
  },
  scrollView: {
    paddingTop: 16,
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: '#ccc',
    textTransform: 'uppercase',
  },
  notif: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    flexShrink: 1,
  },
  notifTime: {
    color: '#888',
  },
  avatar: {
    maxWidth: 42,
    marginRight: 12,
    flexShrink: 0,
  },
});

const DUMMY_DECK = {
  id: '231ff06d-4f6d-4f86-b23e-40871a73b668',
  deckId: '231ff06d-4f6d-4f86-b23e-40871a73b668',
  title: 'deck-231f',
  creator: {
    userId: '39',
    username: 'ccheever',
    photo: {
      url:
        'https://castle.imgix.net/c9b85f2e241ea97e3ab5c0c29b24e11b?auto=compress&ar=5:7&fit=crop&min-w=420',
      __typename: 'HostedFile',
    },
    __typename: 'User',
  },
  isVisible: true,
  initialCard: {
    id: '73135fd7-b368-41c1-aee6-c1b1b983c395',
    cardId: '73135fd7-b368-41c1-aee6-c1b1b983c395',
    title: 'card-7313',
    backgroundImage: {
      url:
        'https://castle.imgix.net/33929e0ebedc6a903bc389743a47cf05?auto=compress&ar=5:7&fit=crop&min-w=420',
      smallUrl:
        'https://castle.imgix.net/33929e0ebedc6a903bc389743a47cf05?auto=compress&ar=5:7&fit=crop&w=420',
      privateCardUrl:
        'https://castle.imgix.net/33929e0ebedc6a903bc389743a47cf05?auto=compress&ar=5:7&fit=crop&w=420&mark-pad=0&mark-h=1&mark-fit=crop&mark64=aHR0cHM6Ly9hc3NldHMuY2FzdGxlLmdhbWVzL2ZhY2Vkb3duLW92ZXJsYXkucG5n',
      __typename: 'HostedFile',
    },
    __typename: 'Card',
  },
  variables: [
    {
      id: 'fdb3cc50-c77a-4808-900f-77b692077b3c',
      name: 'flap',
      type: 'number',
      value: 0,
      initialValue: 0,
    },
    {
      id: 'fe510a8f-cc87-4ef7-8028-cf68220959d8',
      name: 'gameover',
      type: 'number',
      value: 0,
      initialValue: 0,
    },
    {
      id: '82b016d2-363f-493a-87ba-29a97d062b01',
      name: 'score',
      type: 'number',
      value: 0,
      initialValue: 0,
    },
  ],
  __typename: 'Deck',
};

const DUMMY_NOTIF = {
  notificationId: 0,
  type: 'play_deck',
  status: 'seen',
  body: {
    message: [
      {
        userId: 39,
        username: 'ccheever',
      },
      {
        text: ' played your deck.',
      },
    ],
  },
  userIds: [39],
  users: [
    {
      userId: '39',
      username: 'ccheever',
      photo: {
        url:
          'https://castle.imgix.net/c9b85f2e241ea97e3ab5c0c29b24e11b?auto=compress&ar=5:7&fit=crop&min-w=420',
      },
    },
  ],
  deckId: '231ff06d-4f6d-4f86-b23e-40871a73b668',
  deck: DUMMY_DECK,
  updatedTime: '2020-08-30T13:26:00.145Z',
};

const DUMMY_NOTIFS = new Array(5).fill(DUMMY_NOTIF).map((notif, ii) => ({
  ...notif,
  status: ii === 3 ? 'unseen' : 'seen',
  notificationId: ii,
}));

const STATUS_HEADERS = {
  unseen: 'New',
  seen: 'Earlier',
};

const NotificationHeader = ({ status }) => {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{STATUS_HEADERS[status]}</Text>
    </View>
  );
};

const NotificationItem = ({ notification, navigateToUser, navigateToDeck }) => {
  const user = notification.users?.length ? notification.users[0] : null;
  const onPress = React.useCallback(() => {
    if (notification.type === 'play_deck') {
      navigateToDeck(notification.deck);
    } else if (notification.type === 'follow') {
      navigateToUser(user);
    }
  }, [notification, user]);
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.notif}>
        {user?.photo?.url ? (
          <TouchableOpacity style={styles.avatar} onPress={() => navigateToUser(user)}>
            <UserAvatar url={user.photo.url} />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.notifBody}>
          <NotificationBody body={notification.body} navigateToUser={navigateToUser} />
          <Text style={styles.notifTime}> {toRecentDate(notification.updatedTime)}</Text>
        </Text>
        {notification.deck ? (
          <FastImage
            style={{ width: 32, aspectRatio: Constants.CARD_RATIO }}
            source={{ uri: notification.deck.initialCard.backgroundImage.smallUrl }}
          />
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
};

export const NotificationsScreen = () => {
  const insets = useSafeArea();
  const { navigate } = useNavigation();
  const [orderedNotifs, setOrderedNotifs] = React.useState([]);
  React.useEffect(() => {
    if (DUMMY_NOTIFS?.length) {
      setOrderedNotifs(
        DUMMY_NOTIFS.concat().sort((a, b) => {
          if (a.status === b.status) {
            return new Date(b.updatedTime) - new Date(a.updatedTime);
          }
          return a.status === 'seen' ? 1 : -1;
        })
      );
    } else {
      setOrderedNotifs([]);
    }
  }, [DUMMY_NOTIFS]);

  const navigateToUser = React.useCallback((user) => navigate('Profile', { userId: user.userId }), [
    navigate,
  ]);
  const navigateToDeck = React.useCallback((deck) =>
    navigate('PlayDeck', {
      decks: [deck],
      title: 'Notifications',
    })
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Notifications</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {orderedNotifs.map((notif, ii) => (
          <React.Fragment key={`notif-${notif.notificationId}`}>
            {ii === 0 || orderedNotifs[ii - 1].status !== notif.status ? (
              <NotificationHeader key={`header-${notif.status}-${ii}`} status={notif.status} />
            ) : null}
            <NotificationItem
              notification={notif}
              navigateToUser={navigateToUser}
              navigateToDeck={navigateToDeck}
            />
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
};
