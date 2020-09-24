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
});

const DUMMY_NOTIF = {
  appNotificationId: 0,
  type: 'follow',
  status: 'seen',
  body: '@ccheever played your deck',
  createdTime: null,
};

const DUMMY_NOTIFS = new Array(5).fill(DUMMY_NOTIF).map((notif, ii) => ({
  ...notif,
  appNotificationId: ii,
  createdTime: new Date() - ii * 60,
}));

export const NotificationsScreen = () => {
  const insets = useSafeArea();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Notifications</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {DUMMY_NOTIFS.map((notif, ii) => (
          <View>
            <Text style={{ color: '#fff' }}>{notif.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
