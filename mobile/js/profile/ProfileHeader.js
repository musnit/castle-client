import React from 'react';
import { Linking, StyleSheet, Pressable, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { flattenMessageBody } from '../common/chat-utilities';
import { FollowButton } from '../components/FollowButton';
import { MessageBody } from '../components/MessageBody';
import { ProfileBadge } from './ProfileBadge';
import { ProfileConnections } from './ProfileConnections';
import { UserAvatar } from '../components/UserAvatar';
import { useNavigation } from '../ReactNavigation';

import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';

import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
  },
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
  right: { paddingTop: 4, width: '100%', flexShrink: 1 },
  username: {
    fontSize: 20,
    color: Constants.colors.white,
    fontWeight: 'bold',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  followedBy: {
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
  about: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    flexShrink: 1,
  },
  skeletonRow: {
    width: '50%',
    height: 22,
    borderRadius: 2,
    backgroundColor: '#333',
    marginBottom: 12,
  },
});

const aboutStyles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 19,
  },
  highlight: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 19,
  },
  link: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 19,
    fontWeight: 'bold',
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
  if (user?.tiktokUsername) {
    const tiktokUsername = Utilities.validateThirdPartyUsername(user.tiktokUsername);
    linksItems.push({
      label: `tiktok.com/@${tiktokUsername}`,
      onPress: () => Linking.openURL(`https://www.tiktok.com/@${tiktokUsername}`),
      iconType: Feather,
      icon: 'video',
    });
  }
  if (user?.twitterUsername) {
    const twitterUsername = Utilities.validateThirdPartyUsername(user.twitterUsername);
    linksItems.push({
      label: `twitter.com/${twitterUsername}`,
      onPress: () => Linking.openURL(`https://twitter.com/${twitterUsername}`),
      iconType: Entypo,
      icon: 'twitter',
    });
  }
  if (user?.itchUsername) {
    const itchUsername = Utilities.validateThirdPartyUsername(user.itchUsername);
    linksItems.push({
      label: `${itchUsername}.itch.io`,
      onPress: () => Linking.openURL(`https://${itchUsername}.itch.io`),
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

export const ProfileHeader = ({
  user,
  isMe,
  isAnonymous,
  onRefresh,
  loading,
  error,
  onPressSettings,
}) => {
  const { push } = useNavigation();
  let linksItems = makeProfileLinks({ user });

  const navigateToUser = React.useCallback(
    (user) =>
      push(
        'Profile',
        { userId: user.userId },
        {
          isFullscreen: true,
        }
      ),
    [push]
  );

  // server may still return `message: [ { text: '' } ]` when this field is empty
  const flatAboutMe = flattenMessageBody(user?.about);

  return (
    <View style={styles.container}>
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <UserAvatar url={user?.photo?.url} />
        </View>
        {error ? null : loading ? (
          <ProfileLoadingSkeleton />
        ) : (
          <View style={styles.right}>
            <Text style={styles.username}>{user?.username}</Text>
            {flatAboutMe && flatAboutMe.length ? (
              <View style={styles.about}>
                <MessageBody
                  body={user.about}
                  navigateToUser={navigateToUser}
                  styles={aboutStyles}
                />
              </View>
            ) : null}
            <View style={styles.profileItems}>
              {linksItems.length > 0
                ? linksItems.map((item, ii) => {
                    const Icon = item.iconType;
                    return (
                      <Pressable
                        key={`link-item-${ii}`}
                        style={styles.profileItem}
                        onPress={item.onPress}>
                        <Icon name={item.icon} color="#aaa" size={14} style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 16, color: Constants.colors.grayText }}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })
                : null}
              {isMe ? (
                <Pressable style={styles.profileItem} onPress={onPressSettings}>
                  <Feather name="settings" color="#aaa" size={14} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 16, color: Constants.colors.grayText }}>Settings</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
      </View>
      {user && !error ? (
        <>
          {!isMe ? (
            <>
              <View style={styles.profileRow}>
                {!isAnonymous ? <FollowButton user={user} onPress={onRefresh} /> : null}
                {user.connections.includes('followedBy') ? (
                  <View style={[styles.followedBy, { marginLeft: 12 }]}>
                    <Text style={styles.followedByLabel}>Follows You</Text>
                  </View>
                ) : null}
              </View>
              <ProfileConnections connections={user?.connectionsYouKnow} />
            </>
          ) : (
            <View style={styles.profileRow}>
              <View style={styles.followedBy}>
                <Text style={styles.followedByLabel}>{user?.followersCount} Followers</Text>
              </View>
            </View>
          )}
          {user?.badges?.length ? (
            <View style={styles.profileRow}>
              {user.badges.map((badge, ii) => (
                <ProfileBadge badge={badge} key={`badge-${ii}`} />
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
};
