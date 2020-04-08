import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cell: {
    backgroundColor: '#fff',
    height: 100,
    margin: 8,
    padding: 8,
  },
});

/**
 * basic scrollview with nearly empty cells
 */

const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const AppBasicScrollView = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ flexGrow: 1 }}>
        {items.map((item, ii) => (
          <View key={ii} style={styles.cell}>
            <Text>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

/**
 * scrollview with cards
 */
import CardsSet from './CardsSet';
import { DUMMY_DECK } from './DUMMY_DECK';

const AppCardCellScrollView = () => {
  /* const loadDeck = useQuery(
    gql`
      query Deck($deckId: ID!) {
        deck(deckId: $deckId) {
          ${DECK_FRAGMENT}
        }
      }
    `,
    { variables: { deckId: 1 }, fetchPolicy: 'no-cache' }
  );

  let deck;
  if (!loadDeck.loading && !loadDeck.error && loadDeck.data) {
    deck = loadDeck.data.deck;
    } */
  let deck = DUMMY_DECK;

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ flexGrow: 1 }}>
        <CardsSet showNewCard deck={deck} onPress={() => {}} />
      </ScrollView>
    </View>
  );
};

export default AppCardCellScrollView;
