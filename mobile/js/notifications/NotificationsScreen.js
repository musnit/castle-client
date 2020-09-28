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
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import { useSafeArea } from 'react-native-safe-area-context';
import { UserAvatar } from '../components/UserAvatar';

import * as Constants from '../Constants';

import FastImage from 'react-native-fast-image';
import gql from 'graphql-tag';

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

/**
TODO:
  extend type Mutation {
    setNotificationsStatus(notificationIds: [ID]!, status: NotificationStatus!): Null
}
*/

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
  const [fetchNotifs, query] = useLazyQuery(
    gql`
      query {
        notifications(limit: 64) {
          notificationId
          type
          status
          body
          userIds
          users {
            userId
            username
            photo {
              url
            }
          }
          deckId
          deck {
            ${Constants.FEED_ITEM_DECK_FRAGMENT}
          }
          updatedTime
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      fetchNotifs();
    }, [])
  );

  React.useEffect(() => {
    if (query.called && !query.loading && !query.error && query.data) {
      setOrderedNotifs(
        query.data.notifications.concat().sort((a, b) => {
          if (a.status === b.status) {
            return new Date(b.updatedTime) - new Date(a.updatedTime);
          }
          return a.status === 'seen' ? 1 : -1;
        })
      );
    } else {
      setOrderedNotifs([]);
    }
  }, [query.called, query.loading, query.error, query.data]);

  const navigateToUser = React.useCallback((user) => navigate('Profile', { userId: user.userId }), [
    navigate,
  ]);
  const navigateToDeck = React.useCallback((deck) =>
    navigate('PlayDeck', {
      decks: [deck],
      title: 'Notifications',
    })
  );

  const refreshControl = (
    <RefreshControl
      refreshing={query.loading}
      onRefresh={fetchNotifs}
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
              navigateToDeck={navigateToDeck}
            />
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
};
