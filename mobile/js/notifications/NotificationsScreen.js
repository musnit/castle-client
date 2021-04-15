import React from 'react';
import {
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { AuthPrompt } from '../auth/AuthPrompt';
import { FollowButton } from '../components/FollowButton';
import { NotificationBody } from './NotificationBody';
import { ScreenHeader } from '../components/ScreenHeader';
import { toRecentDate } from '../common/date-utilities';
import { useAppState } from '../ghost/GhostAppState';
import { useNavigation, useFocusEffect, useIsFocused } from '../ReactNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession, maybeFetchNotificationsAsync, setNotifBadge } from '../Session';
import { UserAvatar } from '../components/UserAvatar';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';
import * as PushNotifications from '../PushNotifications';

import FastImage from 'react-native-fast-image';

const NOTIF_HEIGHT = 56;

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
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: '#ccc',
    textTransform: 'uppercase',
  },
  notif: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  smallFollowButton: { padding: 6 },
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
    } else if (notification.type === 'new_deck') {
      navigateToDeck(notification.deck);
    } else if (notification.deck) {
      navigateToDeck(notification.deck);
    } else if (user) {
      navigateToUser(user);
    }
  }, [notification, user, navigateToUser, navigateToDeck]);
  const navigateToAllUsers = React.useCallback(() => navigateToUserList(notification.users), [
    notification?.users,
    navigateToUserList,
  ]);
  return (
    <TouchableHighlight onPress={onPress} underlayColor={Constants.colors.tapHighlight}>
      <View style={styles.notif}>
        {user?.photo?.url ? (
          <TouchableHighlight style={styles.avatar} onPress={() => navigateToUser(user)}>
            <UserAvatar url={user.photo.url} />
          </TouchableHighlight>
        ) : null}
        <Text style={styles.notifBody}>
          <NotificationBody
            body={notification.body}
            navigateToUser={navigateToUser}
            navigateToAllUsers={navigateToAllUsers}
          />
          <Text style={styles.notifTime}> {toRecentDate(notification.updatedTime)}</Text>
        </Text>
        {notification.deck && notification.type !== 'follow' ? (
          <FastImage
            style={styles.notifImage}
            source={{ uri: notification.deck.initialCard.backgroundImage.smallUrl }}
          />
        ) : null}
        {user && notification.type === 'follow' ? (
          <FollowButton user={user} style={styles.smallFollowButton} />
        ) : null}
      </View>
    </TouchableHighlight>
  );
};

export const NotificationsScreen = () => {
  const { isAnonymous } = useSession();

  useFocusEffect(
    React.useCallback(() => {
      Amplitude.logEvent('VIEW_NOTIFICATIONS');
    }, [])
  );

  if (isAnonymous) {
    return (
      <SafeAreaView>
        <AuthPrompt title="Stay up to date" message="Get notified when people play your cards." />
      </SafeAreaView>
    );
  } else {
    return <NotificationsScreenAuthenticated />;
  }
};

const NotificationsScreenAuthenticated = () => {
  const { navigate } = useNavigation();
  const [orderedNotifs, setOrderedNotifs] = React.useState([]);
  const [refresh, setRefresh] = React.useState(false);
  const { notifications, markNotificationsReadAsync, isAnonymous } = useSession();
  const isFocused = useIsFocused();

  // Clear the notif badge on tab focus, mark notifs as read on blur
  // Also clear notif badge on blur in case push notifs come in while the user is on the notifs tab
  useFocusEffect(
    React.useCallback(() => {
      setNotifBadge(0);
      maybeFetchNotificationsAsync(false);
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      return () => {
        setNotifBadge(0);
        markNotificationsReadAsync();
      };
    }, [markNotificationsReadAsync])
  );

  // Clear badge + mark notifs read if we background the app while the notifs tab is focused
  useAppState(
    React.useCallback(
      (state) => {
        if (state === 'background' && isFocused) {
          setNotifBadge(0);
          markNotificationsReadAsync();
        }
      },
      [isFocused, markNotificationsReadAsync]
    )
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

  React.useEffect(() => {
    // request permissions and token for push notifs when the notifs tab is first viewed.
    // whether they accept or deny, subsequent calls to this method won't pop up anything for
    // the user.
    if (!isAnonymous) {
      PushNotifications.requestTokenAsync();
    }
  }, [isAnonymous]);

  const onRefresh = React.useCallback(async (force = true) => {
    setRefresh(true);
    try {
      await maybeFetchNotificationsAsync(force);
    } catch (_) {}
    setRefresh(false);
  }, []);

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
  const navigateToUserList = React.useCallback(
    (users) =>
      navigate(
        'UserList',
        { users },
        {
          isFullscreen: true,
        }
      ),
    []
  );
  const navigateToDeck = React.useCallback(
    (deck) =>
      navigate(
        'PlayDeck',
        {
          decks: [deck],
          title: 'Notifications',
        },
        {
          isFullscreen: true,
        }
      ),
    []
  );

  const renderItem = React.useCallback(
    ({ item, index }) => {
      const notif = item;
      const previousNotif = orderedNotifs[index - 1];

      return (
        <React.Fragment>
          {index === 0 || (previousNotif && previousNotif.status !== notif.status) ? (
            <NotificationHeader status={notif.status} />
          ) : null}
          <NotificationItem
            notification={notif}
            navigateToUser={navigateToUser}
            navigateToUserList={navigateToUserList}
            navigateToDeck={navigateToDeck}
          />
        </React.Fragment>
      );
    },
    [orderedNotifs]
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refresh}
      onRefresh={onRefresh}
      tintColor="#fff"
      colors={['#fff', '#ccc']}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Notifications" />
      {orderedNotifs.length > 0 && (
        <FlatList
          data={orderedNotifs}
          contentContainerStyle={styles.scrollView}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.notificationId}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          getItemLayout={(data, index) => ({
            length: NOTIF_HEIGHT,
            offset: NOTIF_HEIGHT * index,
            index,
          })}
        />
      )}
      {notifications && notifications.length === 0 && (
        <View style={Constants.styles.empty}>
          <Text style={Constants.styles.emptyTitle}>No notifications yet</Text>
          <Text style={Constants.styles.emptyText}>
            You'll get notified about new followers or activity on your decks.
          </Text>
        </View>
      )}
      {!notifications && (
        // Check notifications rather than orderedNotifs because orderedNotifs takes a few frames
        // to be created, and we don't want this text to flash for frame
        <View style={Constants.styles.empty}>
          {refresh && <Text style={Constants.styles.emptyText}>Loading...</Text>}
        </View>
      )}
    </SafeAreaView>
  );
};
