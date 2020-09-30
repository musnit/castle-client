import React from 'react';
import {
  RefreshControl,
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
import { useSession } from '../Session';
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

const NotificationItem = ({ notification, navigateToUser, navigateToDeck, navigateToUserList }) => {
  const user = notification.users?.length ? notification.users[0] : null;
  const onPress = React.useCallback(() => {
    if (notification.type === 'play_deck') {
      if (notification.users?.length > 2) {
        navigateToUserList(notification.users);
      } else {
        navigateToDeck(notification.deck);
      }
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
  const [loading, setLoading] = React.useState(false);
  const { notifications, fetchNotificationsAsync, markNotificationsReadAsync } = useSession();

  const onRefresh = React.useCallback(async () => {
    setLoading(true);
    try {
      await fetchNotificationsAsync();
    } catch (_) {}
    setLoading(false);
  }, [fetchNotificationsAsync]);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      onRefresh();
    }, [])
  );

  React.useEffect(() => {
    if (orderedNotifs?.length) {
      const unreadIds = orderedNotifs
        .filter((n) => n.status === 'unseen')
        .map((n) => n.notificationId);
      if (unreadIds.length) {
        markNotificationsReadAsync({
          notificationIds: unreadIds,
        });
      }
    }
    if (notifications) {
      setOrderedNotifs(
        notifications.concat().sort((a, b) => {
          if (a.status === b.status) {
            return new Date(b.updatedTime) - new Date(a.updatedTime);
          }
          return a.status === 'seen' ? 1 : -1;
        })
      );
    } else {
      setOrderedNotifs([]);
    }
  }, [notifications]);

  const navigateToUser = React.useCallback((user) => navigate('Profile', { userId: user.userId }), [
    navigate,
  ]);
  const navigateToUserList = React.useCallback((users) => navigate('UserList', { users }));
  const navigateToDeck = React.useCallback((deck) =>
    navigate('PlayDeck', {
      decks: [deck],
      title: 'Notifications',
    })
  );

  const refreshControl = (
    <RefreshControl
      refreshing={loading}
      onRefresh={onRefresh}
      tintColor="#fff"
      colors={['#fff', '#ccc']}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Notifications</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollView} refreshControl={refreshControl}>
        {orderedNotifs.map((notif, ii) => (
          <React.Fragment key={`notif-${notif.notificationId}`}>
            {ii === 0 || orderedNotifs[ii - 1].status !== notif.status ? (
              <NotificationHeader key={`header-${notif.status}-${ii}`} status={notif.status} />
            ) : null}
            <NotificationItem
              notification={notif}
              navigateToUser={navigateToUser}
              navigateToUserList={navigateToUserList}
              navigateToDeck={navigateToDeck}
            />
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
};
