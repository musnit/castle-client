import React, { Fragment, useState } from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import gql from 'graphql-tag';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CardCell } from '../components/CardCell';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSession } from '../Session';
import { UserAvatar } from '../components/UserAvatar';
import { ProfileSettingsSheet } from './ProfileSettingsSheet';
import Viewport from '../common/viewport';

import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 24,
  },
  navigationRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
  },
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
  back: {
    flexShrink: 0,
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 12,
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

const PlayDeckCell = ({ deck, onPress }) => {
  return (
    <View style={[Constants.styles.gridItem, { width: Viewport.gridItemWidth }]}>
      <CardCell card={deck.initialCard} onPress={onPress} isPrivate={!deck.isVisible} />
    </View>
  );
};

export const ProfileScreen = ({ userId, route }) => {
  const { push, pop, dangerouslyGetState } = useNavigation();
  const [settingsSheetIsOpen, setSettingsSheet] = useState(false);
  const [user, setUser] = React.useState(null);

  // don't useNavigationState() because we don't want to rerender if this changes.
  const navigationStackIndex = dangerouslyGetState().index;

  const { signOutAsync, userId: signedInUserId } = useSession();
  if (!userId && route?.params) {
    userId = route.params.userId;
  }
  const isMe = !userId || userId === signedInUserId;

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

  const refreshControl = (
    <RefreshControl
      refreshing={query.loading}
      onRefresh={onRefresh}
      tintColor="#fff"
      colors={['#fff', '#ccc']}
    />
  );

  return (
    <Fragment>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.header}>
          {navigationStackIndex > 0 ? (
            <View style={styles.navigationRow}>
              <TouchableOpacity style={styles.back} onPress={() => pop()}>
                <Icon name="arrow-back" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={{ width: 96, paddingVertical: 16 }}>
            <UserAvatar url={user?.photo?.url} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.username}>@{user?.username}</Text>
            <View style={styles.profileItems}>
              {urlToDisplay ? (
                <TouchableOpacity
                  style={{ marginRight: 16 }}
                  onPress={() => {
                    Linking.openURL(urlToOpen);
                  }}>
                  <Text style={{ color: '#fff' }}>{urlToDisplay}</Text>
                </TouchableOpacity>
              ) : null}
              {isMe ? (
                <Fragment>
                  <TouchableOpacity onPress={onPressSettings}>
                    <Text style={{ color: '#aaa' }}>Settings</Text>
                  </TouchableOpacity>
                </Fragment>
              ) : null}
            </View>
          </View>
        </SafeAreaView>
        <ScrollView
          contentContainerStyle={Constants.styles.gridContainer}
          refreshControl={refreshControl}>
          {user?.decks
            ? user.decks.map((deck, ii) => (
                <PlayDeckCell
                  key={deck.deckId}
                  deck={deck}
                  onPress={() =>
                    push('PlayDeck', {
                      decks: user.decks,
                      initialDeckIndex: ii,
                      title: `@${user.username}`,
                    })
                  }
                />
              ))
            : null}
        </ScrollView>
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
