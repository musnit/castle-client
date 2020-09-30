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
import { useNavigation } from '../ReactNavigation';
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
  row: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    flexShrink: 1,
  },
  avatar: {
    maxWidth: 42,
    marginRight: 12,
    flexShrink: 0,
  },
  username: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export const UserListScreen = ({ users, route }) => {
  const insets = useSafeArea();
  const { push } = useNavigation();

  if (!users && route?.params) {
    users = route.params.users;
  }
  const navigateToUser = React.useCallback((user) => push('Profile', { userId: user.userId }), [
    push,
  ]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Users</Text>
      </View>
      <ScrollView>
        {users.map((user, ii) => (
          <TouchableWithoutFeedback
            key={`user-${user.userId}`}
            onPress={() => navigateToUser(user)}>
            <View style={styles.row}>
              {user.photo?.url ? (
                <View style={styles.avatar}>
                  <UserAvatar url={user.photo.url} />
                </View>
              ) : null}
              <View style={styles.rowBody}>
                <Text style={styles.username}>{user.username}</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        ))}
      </ScrollView>
    </View>
  );
};
