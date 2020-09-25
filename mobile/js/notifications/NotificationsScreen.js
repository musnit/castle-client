import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NotificationBody } from './NotificationBody';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import { useSafeArea } from 'react-native-safe-area-context';
import { UserAvatar } from '../components/UserAvatar';

import * as Constants from '../Constants';

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
  },
  notifBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  avatar: {
    maxWidth: 42,
    marginRight: 12,
    flexShrink: 0,
  },
});

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
  // deckId, deck,
  updatedTime: '2020-09-20 11:00:00.00Z',
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
  return (
    <View style={styles.notif}>
      {user?.photo?.url ? (
        <TouchableOpacity style={styles.avatar} onPress={() => navigateToUser(user)}>
          <UserAvatar url={user.photo.url} />
        </TouchableOpacity>
      ) : null}
      <Text style={styles.notifBody}>
        <NotificationBody body={notification.body} navigateToUser={navigateToUser} />
      </Text>
    </View>
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
            <NotificationItem notification={notif} navigateToUser={navigateToUser} />
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
};
