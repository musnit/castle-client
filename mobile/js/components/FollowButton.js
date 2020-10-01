import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { toggleFollowUser } from '../Session';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  followButton: {
    backgroundColor: Constants.colors.white,
    borderRadius: 3,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export const FollowButton = ({ user, onPress, style }) => {
  const isFollowing = user?.connections ? user.connections.includes('following') : false;
  const [optimisticFollowing, setOptimisticFollowing] = React.useState(isFollowing);
  React.useEffect(() => setOptimisticFollowing(isFollowing), [isFollowing]);

  const onPressFollow = React.useCallback(async () => {
    setOptimisticFollowing(!isFollowing);
    await toggleFollowUser(user.userId, !isFollowing);
    if (onPress) {
      onPress();
    }
  }, [onPress, isFollowing, user?.userId]);
  if (!user) {
    return null;
  }
  return (
    <TouchableOpacity style={[styles.followButton, style]} onPress={onPressFollow}>
      <Text style={styles.followLabel}>{optimisticFollowing ? 'Unfollow' : 'Follow'}</Text>
    </TouchableOpacity>
  );
};
