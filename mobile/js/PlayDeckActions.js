import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import * as Constants from './Constants';

import UserAvatar from './UserAvatar';

const styles = StyleSheet.create({
  creator: {
    position: 'absolute',
    left: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
  },
  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 16,
    ...Constants.styles.textShadow,
  },
});

const PlayDeckActions = ({ deck }) => {
  const { creator } = deck;
  return (
    <React.Fragment>
      <View style={styles.creator}>
        <View style={styles.avatar}>
          <UserAvatar url={creator.photo?.url} />
        </View>
        <Text style={styles.username}>{creator.username}</Text>
      </View>
    </React.Fragment>
  );
};

export default PlayDeckActions;
