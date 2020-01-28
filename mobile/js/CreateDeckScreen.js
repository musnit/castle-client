import React from 'react';
import gql from 'graphql-tag';
import { View, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import SafeAreaView from 'react-native-safe-area-view';
import { useQuery } from '@apollo/react-hooks';
import { useNavigation, useNavigationEvents } from 'react-navigation-hooks';

import DeckHeader from './DeckHeader';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
    flexShrink: 1,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#f2f2f2',
  },
});

const CardCell = ({ card, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Text>{card.title}</Text>
  </TouchableOpacity>
);

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
      <DeckHeader deck={deck} onPressBack={() => navigation.goBack()} />
      <KeyboardAwareScrollView style={styles.scrollView} contentContainerStyle={{ flex: 1 }}>
        <View style={styles.cards}>
          {deck &&
            deck.cards.map((card) => (
              <CardCell
                key={card.cardId}
                card={card}
                onPress={() =>
                  navigation.push('CreateCard', {
                    deckIdToEdit: deck.deckId,
                    cardIdToEdit: card.cardId,
                  })
                }
              />
            ))}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default CreateDeckScreen;
