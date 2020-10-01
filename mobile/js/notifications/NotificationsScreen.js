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
import { ScreenHeader } from '../components/ScreenHeader';
import { toRecentDate } from '../common/date-utilities';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import { useSafeArea } from 'react-native-safe-area-context';
import { useSession } from '../Session';
import { UserAvatar } from '../components/UserAvatar';

import * as Amplitude from 'expo-analytics-amplitude';
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
    paddingVertical: 16,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  notifBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    flexShrink: 1,
    alignSelf: 'center',
  },
  notifTime: {
    color: '#888',
    fontSize: 13,
  },
  avatar: {
    maxWidth: 36,
    marginRight: 16,
    flexShrink: 0,
  },
  notifImage: {
    height: 36,
    aspectRatio: Constants.CARD_RATIO,
    marginLeft: 16,
    borderRadius: 2,
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
      navigateToDeck(notification.deck);
    } else if (notification.type === 'follow') {
      navigateToUser(user);
    }
  }, [notification, user]);
  const navigateToAllUsers = React.useCallback(() => navigateToUserList(notification.users), [
    notification?.users,
  ]);
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.notif}>
        {user?.photo?.url ? (
          <TouchableOpacity style={styles.avatar} onPress={() => navigateToUser(user)}>
            <UserAvatar url={user.photo.url} />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.notifBody}>
          <NotificationBody
            body={notification.body}
            navigateToUser={navigateToUser}
            navigateToAllUsers={navigateToAllUsers}
          />
          <Text style={styles.notifTime}> {toRecentDate(notification.updatedTime)}</Text>
        </Text>
        {notification.deck ? (
          <FastImage
            style={styles.notifImage}
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

  React.useEffect(() => {
    Amplitude.logEventWithProperties('VIEW_NOTIFICATIONS');
  }, []);

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
      return () => markNotificationsReadAsync();
    }, [])
  );

  React.useEffect(() => {
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

  const navigateToUser = React.useCallback(
    (user) =>
      navigate(
        'Profile',
        { userId: user.userId },
        {
          isFullscreen: true,
        }
      ),
    [navigate]
  );
  const navigateToUserList = React.useCallback((users) =>
    navigate(
      'UserList',
      { users },
      {
        isFullscreen: true,
      }
    )
  );
  const navigateToDeck = React.useCallback((deck) =>
    navigate(
      'PlayDeck',
      {
        decks: [deck],
        title: 'Notifications',
      },
      {
        isFullscreen: true,
      }
    )
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
      <ScreenHeader title="Notifications" />
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
