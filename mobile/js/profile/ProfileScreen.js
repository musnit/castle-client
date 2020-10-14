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
    paddingBottom: 24,
  },
  avatar: { width: 96, margin: 16 },
  username: { marginTop: 4, fontSize: 18, color: Constants.colors.white, fontWeight: 'bold' },
  profileItems: { marginTop: 16, flexDirection: 'row' },
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
  connections: {
    marginTop: 24,
    flexDirection: 'row',
  },
  followedBy: {
    marginLeft: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  followedByLabel: {
    color: Constants.colors.white,
    textTransform: 'uppercase',
    fontSize: 14,
  },
  followers: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  badges: {
    paddingHorizontal: 16,
    flexDirection: 'row',
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
          <ScreenHeader />
          <View style={{ flexDirection: 'row' }}>
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
                    <Text style={{ color: '#fff' }}>{urlToDisplay}</Text>
                  </TouchableOpacity>
                ) : null}
                {isMe ? (
                  <TouchableOpacity onPress={onPressSettings}>
                    <Text style={{ color: '#aaa' }}>Settings</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {!isMe && user ? (
                <View style={styles.connections}>
                  <FollowButton user={user} onPress={onRefresh} />
                  {user.connections.includes('followedBy') ? (
                    <View style={styles.followedBy}>
                      <Text style={styles.followedByLabel}>Follows You</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.followers}>
            <ProfileConnections
              followersCount={user?.followersCount}
              connections={user?.connectionsYouKnow}
            />
          </View>
          {user?.badges?.length ? (
            <PopoverProvider>
              <View style={styles.badges}>
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
