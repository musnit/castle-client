import React, { useState } from 'react';
import { Pressable, StatusBar } from 'react-native';
import { Amplitude } from '@amplitude/react-native';
import { AuthPrompt } from '../auth/AuthPrompt';
import { DecksGrid } from '../components/DecksGrid';
import { EmptyFeed } from '../home/EmptyFeed';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useLazyQuery, gql } from '@apollo/client';
import { useNavigation, useFocusEffect, useScrollToTop } from '../ReactNavigation';
import { useSession } from '../Session';
import { PopoverProvider } from '../components/PopoverProvider';
import { ProfileHeader } from './ProfileHeader';
import { ProfileSettingsSheet } from './ProfileSettingsSheet';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

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
      }`
    );
  } else {
    const [fetchProfile, query] = useLazyQuery(
      gql`
      query UserProfile($userId: ID!) {
        user(userId: $userId) {
          ${Constants.USER_PROFILE_FRAGMENT}
        }
      }`
    );
    return [() => fetchProfile({ variables: { userId } }), query];
  }
};

// keep as separate component so that the isFocused hook doesn't re-render
// the entire profile screen
const ProfileDecksGrid = ({ user, refreshing, onRefresh, error, isMe, ...props }) => {
  const decks = user?.decks.filter((deck) => deck.visibility === 'public');
  const { push } = useNavigation();
  const insets = useSafeAreaInsets();
  const paddingBottom = insets.bottom + (Constants.Android ? 50 : 66); // account for native tab bar

  const scrollViewRef = React.useRef(null);
  useScrollToTop(scrollViewRef);

  return (
    <DecksGrid
      decks={decks}
      onPressDeck={(deck, index) =>
        push(
          'PlayDeck',
          {
            decks,
            initialDeckIndex: index,
            title: `@${user.username}'s Decks`,
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
      contentContainerStyle={{ paddingBottom }}
      {...props}
    />
  );
};

const REFETCH_PROFILE_INTERVAL_MS = 60 * 1000;

export const ProfileScreen = ({ userId, route }) => {
  const [settingsSheetIsOpen, setSettingsSheet] = useState(false);
  const [user, setUser] = React.useState(null);
  const [error, setError] = React.useState(undefined);

  const { userId: signedInUserId, isAnonymous } = useSession();
  if (!userId && route?.params) {
    userId = route.params.userId;
  }
  const isMe = !userId || userId === signedInUserId;

  let lastFetchTime = React.useRef();

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
      Amplitude.getInstance().logEvent('VIEW_PROFILE', { userId, isOwnProfile: isMe });

      if (
        !(lastFetchTime.current && Date.now() - lastFetchTime.current < REFETCH_PROFILE_INTERVAL_MS)
      ) {
        onRefresh();
        lastFetchTime.current = Date.now();
      }
    }, [userId, isMe, onRefresh])
  );

  const settingsSheetOnClose = React.useCallback(
    (isChanged) => {
      setSettingsSheet(false);
      if (isChanged && !isAnonymous) {
        fetchProfile();
      }
    },
    [setSettingsSheet, isAnonymous]
  );

  const ListHeaderComponent = (
    <ProfileHeader
      user={user}
      isMe={isMe}
      isAnonymous={isAnonymous}
      loading={query.loading}
      error={error}
      onRefresh={onRefresh}
      onPressSettings={() => {
        setSettingsSheet(true);
      }}
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
          <ScreenHeader title={'Profile'} />
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
