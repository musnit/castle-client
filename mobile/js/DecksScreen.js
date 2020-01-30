import React from 'react';
import { View, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import gql from 'graphql-tag';
import SafeAreaView from 'react-native-safe-area-view';
import { useQuery } from '@apollo/react-hooks';
import { useNavigation, useNavigationEvents } from 'react-navigation-hooks';

import GameUrlInput from './GameUrlInput';
import Viewport from './viewport';

const { vw, vh } = Viewport;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  scrollView: {
    padding: 12,
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
    borderColor: '#ccc',
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#f2f2f2',
    padding: 8,
  },
  deckFeedItemCard: {
    minHeight: 50 * vh,
    width: '56%',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});

const DeckFeedItem = (props) => {
  const navigation = useNavigation();
  return (
    <View style={styles.deckFeedItemContainer}>
      <TouchableOpacity
        style={styles.deckFeedItemCard}
        onPress={() => {
          navigation.navigate('PlayCard', { deckId: props.deck.deckId });
        }}>
        <Text>{props.deck.title}</Text>
      </TouchableOpacity>
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
        creatorUserId
        currentCard {
          cardId
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
