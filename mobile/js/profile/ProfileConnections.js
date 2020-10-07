import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserAvatar } from '../components/UserAvatar';

const styles = StyleSheet.create({
  text: {
    flexShrink: 1,
    width: '100%',
  },
  body: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 19,
  },
  username: {
    color: '#fff',
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatars: {
    width: 32,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatar1: {
    position: 'absolute',
    width: 28,
  },
  avatar2: {
    position: 'absolute',
    width: 28,
    left: 10,
    top: 14,
  },
});

const UserAvatars = ({ users }) => {
  if (!users?.length) return null;
  if (users.length == 1) {
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
        </React.Fragment>
      );
  }
  return null;
};

export const ProfileConnections = ({ followersCount, connections }) => {
  // nobody in common, just say "N followers"
  if (!connections?.length) {
    return (
      <Text style={styles.body}>
        {followersCount} {followersCount === 1 ? 'follower' : 'followers'}
      </Text>
    );
  }

  // this person has very few total followers. Only mention the ones we know,
  // i.e. "Followed by alice and bob"
  if (followersCount < 3) {
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

  // this person has many followers and we know some of them
  return (
    <View style={styles.row}>
      <UserAvatars users={connections} />
      <View style={styles.text}>
        <Text style={styles.body}>
          Followed by {followersCount} people, including <UsersList users={connections} /> you know
        </Text>
      </View>
    </View>
  );
};
