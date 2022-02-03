import React from 'react';
import {
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { AuthPrompt } from '../auth/AuthPrompt';
import { Amplitude } from '@amplitude/react-native';
import { FollowButton } from '../components/FollowButton';
import { MessageBody } from '../components/MessageBody';
import { NotificationsSettingsSheet } from './NotificationsSettingsSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { toRecentDate } from '../common/date-utilities';
import { useAppState } from '../ghost/GhostAppState';
import { useNavigation, useFocusEffect, useIsFocused } from '../ReactNavigation';
import { useSession, maybeFetchNotificationsAsync, setNotifBadge, fetchMoreNotifications } from '../Session';
import { UserAvatar } from '../components/UserAvatar';

import * as Constants from '../Constants';
import * as PushNotifications from '../PushNotifications';
import * as Utilities from '../common/utilities';

import FastImage from 'react-native-fast-image';

const NOTIF_HEIGHT = 60;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.colors.black,
  },
  tabTitle: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabTitleText: {
    fontSize: 32,
    lineHeight: 36,
    fontFamily: 'Basteleur-Bold',
    color: '#fff',
  },
  settingsButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionLabel: {
    color: Constants.colors.grayText,
    textTransform: 'uppercase',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  notif: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  reactionSticker: { position: 'absolute', right: -14, bottom: -8, width: 32, height: 32 },
});

const notifBodyStyles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 19,
  },
  highlight: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 19,
  },
});

const STATUS_HEADERS = {
  unseen: 'New since last visit',
  seen: 'Previously viewed',
};

// TODO: swap out for different reaction types
const REACTION_IMAGE_FIRE = require('../../assets/images/emoji/fire-selected.png');

const NotificationHeader = ({ status }) => {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{STATUS_HEADERS[status]}</Text>
    </View>
  );
};

const NotificationItem = ({ notification, navigateToUser, navigateToDeck, navigateToUserList }) => {
  const user = notification.users?.length ? notification.users[0] : null;
  const type = Utilities.getNotificationType(notification);

  const onPress = React.useCallback(() => {
    if (type === 'play_deck') {
      navigateToDeck(notification.deck);
    } else if (type === 'follow') {
      navigateToUser(user);
    } else if (type === 'new_deck') {
      navigateToDeck(notification.deck);
    } else if (type === 'react_deck') {
      navigateToDeck(notification.deck);
    } else if (notification.deck) {
      navigateToDeck(notification.deck);
    } else if (user) {
      navigateToUser(user);
    }
  }, [type, notification, user, navigateToUser, navigateToDeck]);
  const navigateToAllUsers = React.useCallback(
    () => navigateToUserList(notification.users),
    [notification?.users, navigateToUserList]
  );
  return (
    <TouchableHighlight onPress={onPress} underlayColor={Constants.colors.tapHighlight}>
      <View style={styles.notif}>
        {user?.photo?.url ? (
          <TouchableHighlight style={styles.avatar} onPress={() => navigateToUser(user)}>
            <UserAvatar url={user.photo.url} />
          </TouchableHighlight>
        ) : null}
        <Text style={styles.notifBody}>
          <MessageBody
            body={notification.body}
            navigateToUser={navigateToUser}
            navigateToAllUsers={navigateToAllUsers}
            styles={notifBodyStyles}
          />
          <Text style={styles.notifTime}> {toRecentDate(notification.updatedTime)}</Text>
        </Text>
        <View>
          {notification.deck && type !== 'follow' ? (
            <FastImage
              style={styles.notifImage}
              source={{ uri: notification.deck.initialCard.backgroundImage.smallUrl }}
            />
          ) : null}
          {user && type === 'follow' ? (
            <FollowButton user={user} style={{ marginLeft: 8 }} />
          ) : null}
          {type === 'react_deck' || type === 'react_comment' ? (
            <FastImage style={styles.reactionSticker} source={REACTION_IMAGE_FIRE} />
          ) : null}
        </View>
      </View>
    </TouchableHighlight>
  );
};

export const NotificationsScreen = () => {
  const { navigate } = useNavigation();
  const [orderedNotifs, setOrderedNotifs] = React.useState([]);
  const [refresh, setRefresh] = React.useState(false);
  const { notifications, markNotificationsReadAsync, isAnonymous } = useSession();
  const isFocused = useIsFocused();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      Amplitude.getInstance().logEvent('VIEW_NOTIFICATIONS');
    }, [])
  );

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

  const handlePushNotificationClicked = React.useCallback(
    (notifications, data) => {
      // NavigationActivity already handles this on android
      if (Platform.OS === 'android') {
        return;
      }

      if ((data.type === 'new_deck' || data.type === 'suggested_deck') && data.notificationId) {
        const notificationTapped = notifications.find(
          (n) => n.notificationId.toString() === data.notificationId.toString()
        );
        if (notificationTapped?.deck) {
          requestAnimationFrame(() => navigateToDeck(notificationTapped.deck));
        }
      }
    },
    [navigateToDeck]
  );

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

      // if we opened the app from a notification and it corresponds to a notification
      // that we just loaded, maybe navigate automatically
      const pushNotificationInitialData = PushNotifications.getInitialData();
      if (pushNotificationInitialData) {
        handlePushNotificationClicked(notifications, pushNotificationInitialData);
        PushNotifications.clearInitialData();
      }
      const pushNotificationClickedData = PushNotifications.getClickedData();
      if (pushNotificationClickedData) {
        handlePushNotificationClicked(notifications, pushNotificationClickedData);
        PushNotifications.clearClickedData();
      }
    } else {
      setOrderedNotifs([]);
    }
  }, [notifications]);

  const onRefresh = React.useCallback(async (force = true) => {
    setRefresh(true);
    try {
      await maybeFetchNotificationsAsync(force);
    } catch (_) {}
    setRefresh(false);
  }, []);

  const onEndReached = React.useCallback(async () => {
    if (refresh) {
      return;
    }

    setRefresh(true);
    try {
      await fetchMoreNotifications(notifications);
    } catch (_) {}
    setRefresh(false);
  }, [refresh]);

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
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.tabTitle}>
          <Text style={styles.tabTitleText}>Notifications</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setIsSettingsOpen(true)}>
            <Constants.CastleIcon
              name="settings"
              color={Constants.colors.grayOnBlackText}
              size={22}
              style={{ marginRight: 2 }}
            />
          </TouchableOpacity>
        </View>
        {orderedNotifs.length > 0 && (
          <FlatList
            data={orderedNotifs}
            contentContainerStyle={styles.scrollView}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.notificationId}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
            onEndReached={onEndReached}
            onEndReachedThreshold={1}
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
              {isAnonymous ? "You'll get notified about new decks." : "You'll get notified about new followers or activity on your decks."}
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
      <NotificationsSettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
