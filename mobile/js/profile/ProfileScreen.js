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
});

const PlayDeckCell = ({ deck, onPress }) => {
  return (
    <View style={styles.deckItem}>
      <CardCell card={deck.initialCard} onPress={onPress} isPrivate={!deck.isVisible} />
    </View>
  );
};

export const ProfileScreen = () => {
  const { navigate } = useNavigation();
  const { signOutAsync } = useSession();

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
    }, [])
  );

  const { loading: queryLoading, error: queryError, data: queryData } = useQuery(gql`
    query Me {
      me {
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
      }
    }
  `);

  let decks;
  if (!queryLoading && !queryError && queryData) {
    // TODO: generalize ProfileScreen to other users, stop using `me` for this query
    decks = queryData.me.decks;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {queryLoading || queryError ? null : (
        <Fragment>
          <SafeAreaView style={styles.header}>
            <View style={{ width: 96, paddingVertical: 16 }}>
              <UserAvatar url={queryData.me.photo?.url} />
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.username}>@{queryData.me.username}</Text>
              <View style={styles.profileItems}>
                {queryData.me.websiteUrl ? (
                  <TouchableOpacity
                    style={{ marginRight: 16 }}
                    onPress={() => {
                      Linking.openURL(queryData.me.websiteUrl);
                    }}>
                    <Text style={{ color: '#fff' }}>{queryData.me.websiteUrl}</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={signOutAsync}>
                  <Text style={{ color: '#aaa' }}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
          <ScrollView contentContainerStyle={styles.scrollView}>
            {decks.map((deck, ii) => (
              <PlayDeckCell
                key={deck.deckId}
                deck={deck}
                onPress={() =>
                  navigate('PlayDeck', {
                    decks,
                    initialDeckIndex: ii,
                    title: `@${queryData.me.username}`,
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
