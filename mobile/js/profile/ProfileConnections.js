import * as React from 'react';
import { StyleSheet, Text } from 'react-native';

const styles = StyleSheet.create({
  body: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 19,
  },
  username: {
    color: '#fff',
    paddingHorizontal: 4,
  },
});

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
        </React.Fragment>
      );
  }
  return null;
};

export const ProfileConnections = ({ followersCount, connections }) => {
  if (!connections?.length) {
    return (
      <Text style={styles.body}>
        {followersCount} {followersCount === 1 ? 'follower' : 'followers'}
      </Text>
    );
  }
  if (followersCount < 3) {
    return (
      <Text style={styles.body}>
        Followed by <UsersList users={connections} />
      </Text>
    );
  }
  return (
    <Text style={styles.body}>
      Followed by {followersCount} people, including <UsersList users={connections} /> you know
    </Text>
  );
};
