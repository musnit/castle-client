import React from 'react';
import { View, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import gql from 'graphql-tag';
import SafeAreaView from 'react-native-safe-area-view';
import { useQuery } from '@apollo/react-hooks';
import { useNavigation, useNavigationEvents } from 'react-navigation-hooks';

import CardCell from './CardCell';
import FastImage from 'react-native-fast-image';
import GameUrlInput from './GameUrlInput';
import Viewport from './viewport';

const { vw, vh } = Viewport;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  scrollView: {
    padding: 16,
  },
  urlInput: {
    width: '100%',
    paddingTop: 4,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  deckFeedItemContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  deckFeedItemCard: {
    aspectRatio: 9/16,
    width: '100%',
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
            navigation.navigate('PlayCard', { deckId: deck.deckId });
          }}
        />
      </View>
    </View>
  );
};

const DecksScreen = (props) => {
  const [lastFocusedTime, setLastFocusedTime] = React.useState(null);

  const query = useQuery(gql`
    query {
      allDecks {
        deckId
        title
        creator {
          userId
          username
        }
        initialCard {
          cardId
          backgroundImage {
            url
          }
        }
      }
    }
  `);

  useNavigationEvents((event) => {
    if (event.type == 'didFocus') {
      StatusBar.setBarStyle('dark-content'); // needed for tab navigator
      if (lastFocusedTime) {
        query.refetch();
      }
      setLastFocusedTime(Date.now());
    }
  });

  let decks;
  if (!query.loading && !query.error && query.data) {
    decks = query.data.allDecks;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.urlInput}>
        <GameUrlInput />
      </View>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <React.Fragment>
          {decks && decks.map((deck) => <DeckFeedItem key={deck.deckId} deck={deck} />)}
        </React.Fragment>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DecksScreen;
