import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { toggleFollowUser } from '../Session';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  followButton: {
    backgroundColor: Constants.colors.white,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  followButtonLabel: {
    fontSize: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
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
      <Text style={styles.followButtonLabel}>{optimisticFollowing ? 'Following' : 'Follow'}</Text>
      {user.followersCount ? (
        <View style={{ borderLeftWidth: 1, borderColor: '#000' }}>
          <Text style={[styles.followButtonLabel, {paddingHorizontal: 8}]}>{user.followersCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};
