import React, { useState } from 'react';
import { StatusBar, View } from 'react-native';
import { AuthPrompt } from '../auth/AuthPrompt';
import { DecksGrid } from '../components/DecksGrid';
import { EmptyFeed } from '../home/EmptyFeed';
import { MiscLinks } from './MiscLinks';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useLazyQuery, gql } from '@apollo/client';
import { useNavigation, useFocusEffect, useScrollToTop } from '../ReactNavigation';
import { useSession } from '../Session';
import { PopoverProvider } from '../components/PopoverProvider';
import { ProfileHeader } from './ProfileHeader';
import { ProfileSettingsSheet } from './ProfileSettingsSheet';

import * as Analytics from '../common/Analytics';
import * as Constants from '../Constants';

const DECKS_PAGE_SIZE = 9;

const useProfileQuery = ({ userId }) => {
  const { userId: signedInUserId } = useSession();
  if (!userId || userId === signedInUserId) {
    const [fetchProfile, query] = useLazyQuery(
      gql`
      query OwnProfile($userId: ID!, $lastModifiedBefore: Datetime) {
        me {
          isAnonymous
          ${Constants.USER_PROFILE_FRAGMENT}
        }
        decksForUser(userId: $userId, limit: ${DECKS_PAGE_SIZE}, filter: public, lastModifiedBefore: $lastModifiedBefore) {
          ${Constants.FEED_ITEM_DECK_FRAGMENT}
        }
      }`
    );
    return [
      ({ lastModifiedBefore } = {}) => fetchProfile({ variables: { userId, lastModifiedBefore } }),
      query,
    ];
  } else {
    const [fetchProfile, query] = useLazyQuery(
      gql`
      query UserProfile($userId: ID!, $lastModifiedBefore: Datetime) {
        user(userId: $userId) {
          ${Constants.USER_PROFILE_FRAGMENT}
        }
        decksForUser(userId: $userId, limit: ${DECKS_PAGE_SIZE}, filter: public, lastModifiedBefore: $lastModifiedBefore) {
          ${Constants.FEED_ITEM_DECK_FRAGMENT}
        }
      }`
    );
    return [
      ({ lastModifiedBefore } = {}) => fetchProfile({ variables: { userId, lastModifiedBefore } }),
      query,
    ];
  }
};

const ProfileDecksGrid = ({ user, decks, refreshing, onRefresh, error, isMe, ...props }) => {
  const { push } = useNavigation();

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
      scrollViewRef={scrollViewRef}
      {...props}
    />
  );
};

const REFETCH_PROFILE_INTERVAL_MS = 60 * 1000;

export const ProfileScreen = (props) => {
  const { userId } = props;
  const { userId: signedInUserId, isAnonymous } = useSession();
  const isMe = !userId || userId === signedInUserId;

  if (isMe && isAnonymous) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <AuthPrompt
          title="Build your profile"
          message="Show off your decks and follow other creators."
        />
        <View style={{ width: '100%', alignItems: 'center', paddingBottom: 16 }}>
          <MiscLinks />
        </View>
      </SafeAreaView>
    );
  }
  return <ProfileScreenAuthenticated {...props} />;
};

const ProfileScreenAuthenticated = ({ userId, route }) => {
  const [settingsSheetIsOpen, setSettingsSheet] = useState(false);
  const [user, setUser] = React.useState(null);
  const [decks, changeDecks] = React.useReducer((state, type) => {
    if (type.type === 'set') {
      return type.decks;
    } else if (type.type === 'append') {
      return state.concat(type.decks);
    }
    return state;
  }, null);
  const [error, setError] = React.useState(undefined);

  const { userId: signedInUserId, isAnonymous } = useSession();
  if (!userId && route?.params) {
    userId = route.params.userId;
  }
  const isMe = !userId || userId === signedInUserId;

  const lastFetched = React.useRef({
    time: undefined,
    lastDeckId: undefined,
  });
  const lastQueryData = React.useRef(null);

  const [fetchProfile, query] = useProfileQuery({ userId: isMe ? signedInUserId : userId });

  const onRefresh = React.useCallback(
    (lastDeck) => {
      fetchProfile({ lastModifiedBefore: lastDeck?.lastModified });
      lastFetched.current = { time: Date.now(), lastDeckId: lastDeck?.deckId };
    },
    [fetchProfile]
  );

  const onEndReached = React.useCallback(() => {
    if (!query.loading && decks?.length >= DECKS_PAGE_SIZE) {
      const lastDeck = decks[decks.length - 1];
      onRefresh(lastDeck);
    }
  }, [query.loading, decks, onRefresh]);

  React.useEffect(() => {
    if (query.called && !query.loading) {
      if (query.data) {
        // Without this, both "set" and "append" get called every time a new page is loaded
        if (lastQueryData.current === query.data) {
          return;
        }
        lastQueryData.current = query.data;

        setUser(isMe ? query.data.me : query.data.user);
        const decks = query.data.decksForUser;
        if (decks.length > 0) {
          if (
            lastFetched.current.lastDeckId &&
            decks[decks.length - 1].deckId !== lastFetched.current.lastDeckId
          ) {
            // append next page
            changeDecks({ type: 'append', decks });
          } else {
            // clean refresh
            changeDecks({ type: 'set', decks });
          }
        }
        setError(undefined);
      } else if (query.error) {
        setError(query.error);
      }
    } else {
      setError(undefined);
    }
  }, [query.called, query.loading, query.error, query.data, isMe]);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Analytics.logEventSkipAmplitude('VIEW_PROFILE', { userId, isOwnProfile: isMe });

      if (
        !query.loading &&
        !(
          lastFetched.current.time &&
          Date.now() - lastFetched.current.time < REFETCH_PROFILE_INTERVAL_MS
        )
      ) {
        onRefresh();
        lastFetched.current.time = Date.now();
      }
    }, [userId, isMe, onRefresh, query])
  );

  const settingsSheetOnClose = React.useCallback(
    (isChanged) => {
      setSettingsSheet(false);
      if (isChanged && !isAnonymous) {
        fetchProfile();
      }
    },
    [fetchProfile, setSettingsSheet, isAnonymous]
  );

  const ListHeaderComponent = (
    <ProfileHeader
      user={user}
      isMe={isMe}
      isAnonymous={isAnonymous}
      loading={query.loading && !user}
      error={error}
      onRefresh={onRefresh}
      onPressSettings={() => {
        setSettingsSheet(true);
      }}
    />
  );

  if (isMe && user && user.isAnonymous) {
    // prevents anonymous user flicker right after signing in
    return <View />;
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <ScreenHeader title={'Profile'} />
        {error ? (
          <EmptyFeed error={error} onRefresh={onRefresh} />
        ) : (
          <PopoverProvider>
            <ProfileDecksGrid
              user={user}
              decks={decks}
              refreshing={query.loading}
              onRefresh={onRefresh}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.5}
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
};
