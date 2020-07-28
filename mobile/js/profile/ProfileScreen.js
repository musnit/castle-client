import React, { Fragment } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import gql from 'graphql-tag';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CardCell } from '../components/CardCell';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSession } from '../Session';
import { UserAvatar } from '../components/UserAvatar';

import * as Constants from '../Constants';

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
    paddingTop: 16,
    paddingLeft: 16,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  deckItem: {
    paddingRight: 16,
    paddingBottom: 16,
    width: '33%',
  },
  back: {
    flexShrink: 0,
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 12,
  },
});

const PROFILE_FRAGMENT = `
  id
  userId
  name
  username
  websiteUrl
  photo {
    url
  }
  decks {
    id
    deckId
    title
    creator {
      userId
      username
      photo {
        url
      }
    }
    isVisible
    initialCard {
      id
      cardId
      title
      backgroundImage {
        url
        smallUrl
        privateCardUrl
      }
    }
    variables
  }
`;

const useProfileQuery = (userId) => {
  const { userId: signedInUserId } = useSession();
  if (!userId || userId === signedInUserId) {
    return useQuery(
      gql`
      query Me {
        me {
          ${PROFILE_FRAGMENT}
        }
      }`,
      { fetchPolicy: 'no-cache' }
    );
  } else {
    return useQuery(
      gql`
      query UserProfile($userId: ID!) {
        user(userId: $userId) {
          ${PROFILE_FRAGMENT}
        }
      }`,
      { fetchPolicy: 'no-cache', variables: { userId } }
    );
  }
};

const PlayDeckCell = ({ deck, onPress }) => {
  return (
    <View style={styles.deckItem}>
      <CardCell card={deck.initialCard} onPress={onPress} isPrivate={!deck.isVisible} />
    </View>
  );
};

export const ProfileScreen = ({ userId, route }) => {
  const { push, pop, dangerouslyGetState } = useNavigation();

  // don't useNavigationState() because we don't want to rerender if this changes.
  const navigationStackIndex = dangerouslyGetState().index;

  const { signOutAsync, userId: signedInUserId } = useSession();
  if (!userId && route?.params) {
    userId = route.params.userId;
  }
  const isMe = !userId || userId === signedInUserId;

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
    }, [])
  );

  const { loading: queryLoading, error: queryError, data } = useProfileQuery(userId);

  let decks, queryData;
  if (!queryLoading && !queryError) {
    queryData = isMe ? data.me : data.user;
    decks = queryData.decks;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {queryLoading || queryError ? null : (
        <Fragment>
          <SafeAreaView style={styles.header}>
            {navigationStackIndex > 0 ? (
              <View style={styles.navigationRow}>
                <TouchableOpacity style={styles.back} onPress={() => pop()}>
                  <Icon name="arrow-back" size={32} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={{ width: 96, paddingVertical: 16 }}>
              <UserAvatar url={queryData.photo?.url} />
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.username}>@{queryData.username}</Text>
              <View style={styles.profileItems}>
                {queryData.websiteUrl ? (
                  <TouchableOpacity
                    style={{ marginRight: 16 }}
                    onPress={() => {
                      Linking.openURL(queryData.websiteUrl);
                    }}>
                    <Text style={{ color: '#fff' }}>{queryData.websiteUrl}</Text>
                  </TouchableOpacity>
                ) : null}
                {isMe ? (
                  <TouchableOpacity onPress={signOutAsync}>
                    <Text style={{ color: '#aaa' }}>Log Out</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </SafeAreaView>
          <ScrollView contentContainerStyle={styles.scrollView}>
            {decks.map((deck, ii) => (
              <PlayDeckCell
                key={deck.deckId}
                deck={deck}
                onPress={() =>
                  push('PlayDeck', {
                    decks,
                    initialDeckIndex: ii,
                    title: `@${queryData.username}`,
                  })
                }
              />
            ))}
          </ScrollView>
        </Fragment>
      )}
    </View>
  );
};
