import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  const { push } = useNavigation();

  return (
    <React.Fragment>
      <TouchableOpacity
        style={styles.creator}
        onPress={() => push('Profile', { userId: creator.userId })}>
        <View style={styles.avatar}>
          <UserAvatar url={creator.photo?.url} />
        </View>
        <Text style={styles.username}>{creator.username}</Text>
      </TouchableOpacity>
    </React.Fragment>
  );
};
