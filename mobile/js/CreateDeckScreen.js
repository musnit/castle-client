import React from 'react';
import gql from 'graphql-tag';
import { View, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import SafeAreaView from 'react-native-safe-area-view';
import { useQuery } from '@apollo/react-hooks';
import { useNavigation, useNavigationEvents } from 'react-navigation-hooks';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
  },
});

const DeckHeader = ({ deck }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{deck && deck.title}</Text>
    </View>
  );
};

const CreateDeckScreen = (props) => {
  let lastFocusedTime;
  const navigation = useNavigation();
  const deckId = navigation.state.params.deckIdToEdit;
  const query = useQuery(
    gql`
      query Deck($deckId: ID!) {
        deck(deckId: $deckId) {
          deckId
          title
          cards {
            cardId
            title
          }
        }
      }
    `,
    { variables: { deckId } }
  );
  useNavigationEvents((event) => {
    if (event.type == 'didFocus') {
      if (lastFocusedTime) {
        query.refetch();
      }
      lastFocusedTime = Date.now();
    }
  });

  let deck;
  if (!query.loading && !query.error && query.data) {
    deck = query.data.deck;
  }
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView style={styles.scrollView} contentContainerStyle={{ flex: 1 }}>
        <DeckHeader deck={deck} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default CreateDeckScreen;
