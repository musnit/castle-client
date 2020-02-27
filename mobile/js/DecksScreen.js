import React from 'react';
import { View, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import gql from 'graphql-tag';
import SafeAreaView from 'react-native-safe-area-view';
import { useLazyQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import CardCell from './CardCell';
import FastImage from 'react-native-fast-image';
import GameUrlInput from './GameUrlInput';
import Viewport from './viewport';

const { vw, vh } = Viewport;

const REFETCH_FEED_INTERVAL_MS = 30 * 1000;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  scrollView: {
    padding: 16,
  },
  urlInput: {
    paddingBottom: 16,
  },
  deckFeedItemContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  deckFeedItemCard: {
    aspectRatio: 9 / 16,
    height: 75 * vh,
  },
});

const DeckFeedItem = ({ deck }) => {
  const navigation = useNavigation();
  return (
    <View style={styles.deckFeedItemContainer}>
      <View style={styles.deckFeedItemCard}>
        <CardCell
          card={deck.initialCard}
          title={deck.creator.username}
          onPress={() => {
            if (deck.initialCard && deck.initialCard.cardId) {
              navigation.navigate('PlayCard', {
                deckId: deck.deckId,
                cardId: deck.initialCard.cardId,
              });
            } else {
              navigation.navigate('PlayCard', {
                deckId: deck.deckId,
              });
            }
          }}
        />
      </View>
    </View>
  );
};

const DecksScreen = (props) => {
  const [lastFetchedTime, setLastFetchedTime] = React.useState(null);

  const [fetchDecks, query] = useLazyQuery(
    gql`
      query {
        allDecks {
          id
          deckId
          title
          creator {
            userId
            username
          }
          initialCard {
            id
            cardId
            title
            backgroundImage {
              fileId
              url
              primaryColor
            }
            blocks {
              id
              cardBlockId
              cardBlockUpdateId
              type
              title
              destinationCardId
            }
          }
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('dark-content'); // needed for tab navigator
      if (!lastFetchedTime || Date.now() - lastFetchedTime > REFETCH_FEED_INTERVAL_MS) {
        fetchDecks();
        setLastFetchedTime(Date.now());
      }
    }, [lastFetchedTime])
  );

  let decks;
  if (query.called && !query.loading && !query.error && query.data) {
    decks = query.data.allDecks;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <React.Fragment>
          <View style={styles.urlInput}>
            <GameUrlInput />
          </View>
          {decks && decks.map((deck) => <DeckFeedItem key={deck.deckId} deck={deck} />)}
        </React.Fragment>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DecksScreen;
