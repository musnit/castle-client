import React from 'react';
import { View, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import gql from 'graphql-tag';
import SafeAreaView from 'react-native-safe-area-view';
import { useQuery } from '@apollo/react-hooks';
import { useNavigation, useNavigationEvents } from 'react-navigation-hooks';

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
    marginBottom: 16,
  },
  deckFeedItemMeta: {
    padding: 8,
  },
  deckFeedItemCreator: {
    color: '#666',
    fontWeight: '700',
  },
  deckFeedItemContent: {
    width: '100%',
    borderColor: '#ccc',
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  deckFeedItemPreviewImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 6,
  },
  deckFeedItemTitle: {
    backgroundColor: '#fff',
    padding: 4,
  },
});

const DeckFeedItem = ({ deck }) => {
  const navigation = useNavigation();
  return (
    <View style={styles.deckFeedItemContainer}>
      <View style={styles.deckFeedItemMeta}>
        <Text style={styles.deckFeedItemCreator}>{deck.creator.username}</Text>
      </View>
      <View style={styles.deckFeedItemContent}>
        <TouchableOpacity
          style={styles.deckFeedItemCard}
          onPress={() => {
            navigation.navigate('PlayCard', { deckId: deck.deckId });
          }}>
          {deck.initialCard && deck.initialCard.backgroundImage && (
            <FastImage
              style={styles.deckFeedItemPreviewImage}
              source={{ uri: deck.initialCard.backgroundImage.url }}
            />
          )}
          <Text style={styles.deckFeedItemTitle}>{deck.title}</Text>
        </TouchableOpacity>
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
