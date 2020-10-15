import React, { Fragment, useState } from 'react';
import { Linking, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import gql from 'graphql-tag';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DecksGrid } from '../components/DecksGrid';
import { FollowButton } from '../components/FollowButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import { useSession } from '../Session';
import { UserAvatar } from '../components/UserAvatar';
import { PopoverProvider } from '../scenecreator/PopoverProvider';
import { ProfileBadge } from './ProfileBadge';
import { ProfileConnections } from './ProfileConnections';
import { ProfileSettingsSheet } from './ProfileSettingsSheet';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    width: '100%',
    paddingBottom: 8,
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
  username: {
    fontSize: 20,
    color: Constants.colors.white,
  },
  profileItems: { marginTop: 8, flexDirection: 'row' },
  scrollView: {
    paddingTop: 2,
    paddingLeft: 2,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  deckItem: {
    paddingRight: 2,
    paddingBottom: 2,
    width: '33.3%',
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
  followers: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
});

const useProfileQuery = (userId) => {
  const { userId: signedInUserId } = useSession();
  if (!userId || userId === signedInUserId) {
    return useLazyQuery(
      gql`
      query Me {
        me {
          ${Constants.USER_PROFILE_FRAGMENT}
        }
      }`,
      { fetchPolicy: 'no-cache' }
    );
  } else {
    const [fetchProfile, query] = useLazyQuery(
      gql`
      query UserProfile($userId: ID!) {
        user(userId: $userId) {
          ${Constants.USER_PROFILE_FRAGMENT}
        }
      }`,
      { fetchPolicy: 'no-cache' }
    );
    return [() => fetchProfile({ variables: { userId } }), query];
  }
};

export const ProfileScreen = ({ userId, route }) => {
  const { push } = useNavigation();
  const [settingsSheetIsOpen, setSettingsSheet] = useState(false);
  const [user, setUser] = React.useState(null);

  const { signOutAsync, userId: signedInUserId } = useSession();
  if (!userId && route?.params) {
    userId = route.params.userId;
  }
  const isMe = !userId || userId === signedInUserId;

  React.useEffect(() => {
    Amplitude.logEventWithProperties('VIEW_PROFILE', { userId, isOwnProfile: isMe });
  }, []);

  const [fetchProfile, query] = useProfileQuery(userId);

  const onRefresh = React.useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  React.useEffect(() => {
    if (query.called && !query.loading && !query.error && query.data) {
      setUser(isMe ? query.data.me : query.data.user);
    }
  }, [query.called, query.loading, query.error, query.data]);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      onRefresh();
    }, [])
  );

  const { urlToDisplay, urlToOpen } = Utilities.canonizeUserProvidedUrl(user?.websiteUrl);

  const onPressSettings = () => setSettingsSheet(true);
  const settingsSheetOnClose = () => setSettingsSheet(false);

  return (
    <Fragment>
      <View style={styles.container}>
        <SafeAreaView style={styles.header}>
          <ScreenHeader title="Profile" />
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <UserAvatar url={user?.photo?.url} />
            </View>
            <View style={{ paddingVertical: 16 }}>
              <Text style={styles.username}>@{user?.username}</Text>
              <View style={styles.profileItems}>
                {urlToDisplay ? (
                  <TouchableOpacity
                    style={{ marginRight: isMe ? 16 : 0 }}
                    onPress={() => {
                      Linking.openURL(urlToOpen);
                    }}>
                    <Text style={{ fontSize: 16, color: Constants.colors.grayText }}>{urlToDisplay}</Text>
                  </TouchableOpacity>
                ) : null}
                {isMe ? (
                  <TouchableOpacity onPress={onPressSettings}>
                    <Text style={{ fontSize: 16, color: Constants.colors.grayText }}>Settings</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
          {!isMe && user ? (
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
        </SafeAreaView>
        <DecksGrid
          decks={user?.decks}
          onPressDeck={(deck, index) =>
            push(
              'PlayDeck',
              {
                decks: user?.decks,
                initialDeckIndex: index,
                title: `@${user.username}`,
              },
              {
                isFullscreen: true,
              }
            )
          }
          refreshing={query.loading}
          onRefresh={onRefresh}
        />
      </View>
      {isMe && user ? (
        <ProfileSettingsSheet
          me={user}
          isOpen={settingsSheetIsOpen}
          onClose={settingsSheetOnClose}
        />
      ) : null}
    </Fragment>
  );
};
