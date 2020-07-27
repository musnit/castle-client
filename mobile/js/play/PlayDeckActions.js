import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { UserAvatar } from '../components/UserAvatar';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  creator: {
    position: 'absolute',
    left: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
  },
  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 16,
    ...Constants.styles.textShadow,
  },
});

export const PlayDeckActions = ({ deck }) => {
  const { creator } = deck;
  return (
    <React.Fragment>
      <View style={styles.creator} pointerEvents="none">
        <View style={styles.avatar}>
          <UserAvatar url={creator.photo?.url} />
        </View>
        <Text style={styles.username}>{creator.username}</Text>
      </View>
    </React.Fragment>
  );
};
