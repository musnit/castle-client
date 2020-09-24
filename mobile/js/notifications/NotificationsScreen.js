import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';

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
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: '#fff',
    textTransform: 'uppercase',
  },
  notif: {
    padding: 16,
  },
  notifBody: {
    color: '#fff',
    fontSize: 16,
  },
});

const DUMMY_NOTIF = {
  appNotificationId: 0,
  type: 'follow',
  status: 'seen',
  body: '@ccheever played your deck',
  lastModified: '2020-09-20 11:00:00.00Z',
};

const DUMMY_NOTIFS = new Array(5).fill(DUMMY_NOTIF).map((notif, ii) => ({
  ...notif,
  status: ii === 3 ? 'unseen' : 'seen',
  appNotificationId: ii,
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

const NotificationItem = ({ notification }) => {
  return (
    <View style={styles.notif}>
      <Text style={styles.notifBody}>{notification.body}</Text>
    </View>
  );
};

export const NotificationsScreen = () => {
  const insets = useSafeArea();
  const [orderedNotifs, setOrderedNotifs] = React.useState([]);
  React.useEffect(() => {
    if (DUMMY_NOTIFS?.length) {
      setOrderedNotifs(
        DUMMY_NOTIFS.concat().sort((a, b) => {
          if (a.status === b.status) {
            return new Date(b.lastModified) - new Date(a.lastModified);
          }
          return a.status === 'seen' ? 1 : -1;
        })
      );
    } else {
      setOrderedNotifs([]);
    }
  }, [DUMMY_NOTIFS]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Notifications</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {orderedNotifs.map((notif, ii) => (
          <React.Fragment>
            {ii === 0 || orderedNotifs[ii - 1].status !== notif.status ? (
              <NotificationHeader status={notif.status} />
            ) : null}
            <NotificationItem key={`notif-${notif.appNotificationId}`} notification={notif} />
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
};
