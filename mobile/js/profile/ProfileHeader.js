import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FollowButton } from '../components/FollowButton';
import { PopoverProvider } from '../components/PopoverProvider';
import { ProfileBadge } from './ProfileBadge';
import { ProfileConnections } from './ProfileConnections';
import { UserAvatar } from '../components/UserAvatar';

import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';

const styles = StyleSheet.create({
  profileRow: {
    padding: 16,
    paddingBottom: 0,
    flexDirection: 'row',
  },
  avatar: {
    width: 72,
    marginTop: 4,
    marginRight: 16,
  },
  right: { paddingVertical: 16 },
  username: {
    fontSize: 20,
    color: Constants.colors.white,
  },
  profileItems: { marginTop: 8 },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followedBy: {
    marginLeft: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Constants.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  followedByLabel: {
    color: Constants.colors.white,
    textTransform: 'uppercase',
    fontSize: 13,
    letterSpacing: 1,
  },
  skeletonRow: {
    width: '50%',
    height: 22,
    borderRadius: 2,
    backgroundColor: '#333',
    marginBottom: 12,
  },
});

const makeProfileLinks = ({ user }) => {
  let linksItems = [];
  if (user?.websiteUrl) {
    const { urlToDisplay, urlToOpen } = Utilities.canonizeUserProvidedUrl(user?.websiteUrl);
    linksItems.push({
      label: urlToDisplay,
      onPress: () => Linking.openURL(urlToOpen),
      iconType: Entypo,
      icon: 'globe',
    });
  }
  if (user?.twitterUsername) {
    linksItems.push({
      label: `twitter.com/${user.twitterUsername}`,
      onPress: () => Linking.openURL(`https://twitter.com/${user.twitterUsername}`),
      iconType: Entypo,
      icon: 'twitter',
    });
  }
  if (user?.itchUsername) {
    linksItems.push({
      label: `${user.itchUsername}.itch.io`,
      onPress: () => Linking.openURL(`https://${user.itchUsername}.itch.io`),
      iconType: Entypo,
      icon: 'game-controller',
    });
  }
  return linksItems;
};

const ProfileLoadingSkeleton = () => (
  <View style={[styles.right, { width: '100%' }]}>
    <View style={styles.skeletonRow} />
    <View style={styles.skeletonRow} />
    <View style={styles.skeletonRow} />
  </View>
);

export const ProfileHeader = ({ user, isMe, onPressSettings, onRefresh, loading, error }) => {
  let linksItems = makeProfileLinks({ user });
  if (isMe) {
    linksItems.push({
      label: 'Settings',
      onPress: onPressSettings,
      iconType: MaterialIcons,
      icon: 'settings',
    });
  }

  return (
    <>
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <UserAvatar url={user?.photo?.url} />
        </View>
        {error ? null : loading ? (
          <ProfileLoadingSkeleton />
        ) : (
          <View style={styles.right}>
            <Text style={styles.username}>@{user?.username}</Text>
            <View style={styles.profileItems}>
              {linksItems.length > 0
                ? linksItems.map((item, ii) => {
                    const Icon = item.iconType;
                    return (
                      <TouchableOpacity
                        key={`link-item-${ii}`}
                        style={[
                          styles.profileItem,
                          { marginBottom: ii < linksItems.length - 1 ? 8 : 0 },
                        ]}
                        onPress={item.onPress}>
                        <Icon name={item.icon} color="#aaa" size={14} style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 16, color: Constants.colors.grayText }}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                : null}
            </View>
          </View>
        )}
      </View>
      {user && !error ? (
        <>
          {!isMe ? (
            <View style={styles.profileRow}>
              <FollowButton user={user} onPress={onRefresh} />
              {user.connections.includes('followedBy') ? (
                <View style={styles.followedBy}>
                  <Text style={styles.followedByLabel}>Follows You</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <ProfileConnections
            followersCount={user?.followersCount}
            connections={user?.connectionsYouKnow}
          />
          {user?.badges?.length ? (
            <PopoverProvider>
              <View style={styles.profileRow}>
                {user.badges.map((badge, ii) => (
                  <ProfileBadge badge={badge} key={`badge-${ii}`} />
                ))}
              </View>
            </PopoverProvider>
          ) : null}
        </>
      ) : null}
    </>
  );
};
