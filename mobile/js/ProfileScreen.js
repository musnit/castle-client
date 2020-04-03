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
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSession } from './Session';
import { SafeAreaView } from 'react-native-safe-area-context';

import CardCell from './CardCell';
import Icon from 'react-native-vector-icons/MaterialIcons';
import UserAvatar from './UserAvatar';

import * as GameScreen from './GameScreen';

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  back: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const PlayDeckCell = ({ deck, onPress }) => {
  return (
    <View style={{ paddingRight: 8, paddingBottom: 8, width: '33%' }}>
      <CardCell card={deck.initialCard} onPress={onPress} />
    </View>
  );
};

const ProfileScreen = () => {
  const { navigate } = useNavigation();
  const { signOutAsync } = useSession();

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('dark-content'); // needed for tab navigator
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
          isVisible
          initialCard {
            id
            cardId
            title
            backgroundImage {
              url
            }
          }
        }
      }
    }
  `);

  const onPressLogOut = async () => {
    await signOutAsync();
    GameScreen.goToGame({});
  };

  let decks;
  if (!queryLoading && !queryError && queryData) {
    // TODO: generalize ProfileScreen to other users, stop using `me` for this query
    decks = queryData.me.decks.filter((deck) => deck.isVisible);
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#f2f2f2',
      }}>
      <StatusBar barStyle="dark-content" />
      {queryLoading || queryError ? null : (
        <Fragment>
          <SafeAreaView
            style={{
              width: '100%',
              alignItems: 'center',
              paddingBottom: 24,
              backgroundColor: '#fff',
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 1,
              },
              shadowOpacity: 0.2,
              shadowRadius: 1.41,
              elevation: 2,
            }}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.back} onPress={() => navigate('Play')}>
                <Icon name="close" size={32} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={{ width: 96, paddingVertical: 16 }}>
              <UserAvatar url={queryData.me.photo?.url} />
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontFamily: 'RTAliasGrotesk-Bold' }}>
                {queryData.me.name}
              </Text>
              <Text style={{ marginTop: 4, fontSize: 18, fontFamily: 'RTAliasGrotesk-Regular' }}>
                @{queryData.me.username}
              </Text>
              <View style={{ marginTop: 16, flexDirection: 'row' }}>
                {queryData.me.websiteUrl ? (
                  <TouchableOpacity
                    style={{
                      marginRight: 16,
                    }}
                    onPress={() => {
                      Linking.openURL(queryData.me.websiteUrl);
                    }}>
                    <Text>{queryData.me.websiteUrl}</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={onPressLogOut}>
                  <Text style={{ color: '#aaa' }}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
          <ScrollView
            contentContainerStyle={{
              padding: 8,
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}>
            {decks.map((deck) => (
              <PlayDeckCell
                key={deck.deckId}
                deck={deck}
                onPress={() =>
                  navigate('PlayDeck', { deckId: deck.deckId, cardId: deck.initialCard.cardId })
                }
              />
            ))}
          </ScrollView>
        </Fragment>
      )}
    </View>
  );
};

export default ProfileScreen;
