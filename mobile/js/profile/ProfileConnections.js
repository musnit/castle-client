import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from '../components/UserAvatar';
import * as Constants from '../Constants';

const styles = StyleSheet.create({
  text: {
    flexShrink: 1,
    maxWidth: '100%',
  },
  body: {
    color: Constants.colors.white,
    fontSize: 16,
    lineHeight: 20,
  },
  username: {
    paddingHorizontal: 4,
    fontWeight: 'bold',
  },
  row: {
    paddingTop: 12,
    paddingBottom: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatars: {
    width: 36,
    height: 36,
    marginRight: 16,
  },
  avatar1: {
    position: 'absolute',
    width: 24,
    left: 0,
    top: 0,
  },
  avatar2: {
    position: 'absolute',
    width: 24,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});

const UserAvatars = ({ users }) => {
  if (!users?.length) return null;
  if (users.length === 1) {
    return <UserAvatar style={styles.avatars} url={users[0].photo.url} />;
  } else {
    return (
      <View style={styles.avatars}>
        <UserAvatar style={styles.avatar1} url={users[0].photo.url} />
        <UserAvatar style={styles.avatar2} url={users[1].photo.url} />
      </View>
    );
  }
};

const User = ({ user }) => <Text style={styles.username}>{user.username}</Text>;

const UsersList = ({ users }) => {
  switch (users.length) {
    case 1:
      return <User user={users[0]} />;
    case 2:
      return (
        <React.Fragment>
          <User user={users[0]} />
          {' and '}
          <User user={users[1]} />
        </React.Fragment>
      );
    case 3:
      return (
        <React.Fragment>
          <User user={users[0]} />, <User user={users[1]} />,{' and '}
          <Text style={styles.username}>1 other</Text>
        </React.Fragment>
      );
    default:
      return (
        <React.Fragment>
          <User user={users[0]} />, <User user={users[1]} />,{' and '}
          <Text style={styles.username}>{users.length - 2} others</Text>
          <Text> you know</Text>
        </React.Fragment>
      );
  }
};

export const ProfileConnections = ({ connections }) => {
  if (connections.length) {
    return (
      <View style={styles.row}>
        <UserAvatars users={connections} />
        <View style={styles.text}>
          <Text style={styles.body}>
            Followed by <UsersList users={connections} />
          </Text>
        </View>
      </View>
    );
  }
  return null;
};
