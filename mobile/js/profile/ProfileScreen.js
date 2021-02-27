import React, { Fragment, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import gql from 'graphql-tag';
import { AuthPrompt } from '../auth/AuthPrompt';
import { DecksGrid } from '../components/DecksGrid';
import { EmptyFeed } from '../home/EmptyFeed';
import { SafeAreaView, useSafeArea } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect, useIsFocused, useScrollToTop } from '../ReactNavigation';
import { useSession } from '../Session';
import { PopoverProvider } from '../components/PopoverProvider';
import { ProfileHeader } from './ProfileHeader';
import { ProfileSettingsSheet } from './ProfileSettingsSheet';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';

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

// keep as separate component so that the isFocused hook doesn't re-render
// the entire profile screen
const ProfileDecksGrid = ({ user, refreshing, onRefresh, error, isMe, ...props }) => {
  const decks = user?.decks.filter((deck) => deck.isVisible);
  const { push } = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeArea();
  const paddingBottom = Constants.iOS ? insets.bottom : insets.bottom + 50; // account for android native tab bar

  const scrollViewRef = React.useRef(null);
  useScrollToTop(scrollViewRef);

  return (
    <DecksGrid
      decks={decks}
      onPressDeck={(deck, index) =>
        push(
          'PlayDeck',
          {
            // TODO: support list of decks
            decks: [deck],
            initialDeckIndex: 0,
            title: `@${user.username}`,
          },
          {
            isFullscreen: true,
          }
        )
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
      enablePreviewVideo={false}
      scrollViewRef={scrollViewRef}
      contentContainerStyle={{ paddingTop: 0, paddingBottom }}
      {...props}
    />
  );
};

const REFETCH_PROFILE_INTERVAL_MS = 60 * 1000;

export const ProfileScreen = ({ userId, route }) => {
  const [settingsSheetIsOpen, setSettingsSheet] = useState(false);
  const [user, setUser] = React.useState(null);
  const [error, setError] = React.useState(undefined);

  const { signOutAsync, userId: signedInUserId, isAnonymous } = useSession();
  if (!userId && route?.params) {
    userId = route.params.userId;
  }
  const isMe = !userId || userId === signedInUserId;

  let lastFetchTime;

  React.useEffect(() => {
    Amplitude.logEventWithProperties('VIEW_PROFILE', { userId, isOwnProfile: isMe });
  }, []);

  const [fetchProfile, query] = useProfileQuery(userId);

  const onRefresh = React.useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  React.useEffect(() => {
    if (query.called && !query.loading) {
      if (query.data) {
        setUser(isMe ? query.data.me : query.data.user);
        setError(undefined);
      } else if (query.error) {
        setError(query.error);
      }
    } else {
      setError(undefined);
    }
  }, [query.called, query.loading, query.error, query.data]);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator

      if (!(lastFetchTime && Date.now() - lastFetchTime < REFETCH_PROFILE_INTERVAL_MS)) {
        onRefresh();
        lastFetchTime = Date.now();
      }
    }, [])
  );

  const settingsSheetOnClose = (isChanged) => {
    setSettingsSheet(false);
    if (isChanged) {
      fetchProfile();
    }
  };

  const ListHeaderComponent = (
    <ProfileHeader
      user={user}
      isMe={isMe}
      isAnonymous={isAnonymous}
      loading={query.loading}
      error={error}
      onRefresh={onRefresh}
    />
  );

  if (isMe && isAnonymous) {
    return (
      <SafeAreaView>
        <AuthPrompt
          title="Build your profile"
          message="Show off your decks and follow other creators."
        />
      </SafeAreaView>
    );
  } else {
    return (
      <>
        <SafeAreaView edges={['top', 'left', 'right']}>
          <ScreenHeader
            title={user ? '@' + user.username : 'Profile'}
            rightIcon={isMe ? 'settings' : null}
            onRightButtonPress={() => setSettingsSheet(true)}
          />
          {error ? (
            <EmptyFeed error={error} onRefresh={onRefresh} />
          ) : (
            <PopoverProvider>
              <ProfileDecksGrid
                user={user}
                refreshing={query.loading}
                onRefresh={onRefresh}
                error={error}
                isMe={isMe}
                ListHeaderComponent={ListHeaderComponent}
              />
            </PopoverProvider>
          )}
        </SafeAreaView>
        {isMe && user ? (
          <ProfileSettingsSheet
            me={user}
            isOpen={settingsSheetIsOpen}
            onClose={settingsSheetOnClose}
          />
        ) : null}
      </>
    );
  }
};
