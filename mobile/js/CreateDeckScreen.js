import React from 'react';
import gql from 'graphql-tag';
import { View, StyleSheet, Text } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import SafeAreaView from 'react-native-safe-area-view';
import { useQuery } from '@apollo/react-hooks';
import { useNavigation, useNavigationEvents } from 'react-navigation-hooks';

import CardsGrid from './CardsGrid';
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
});

const CreateDeckScreen = (props) => {
  let lastFocusedTime;
  const navigation = useNavigation();
  const deckId = navigation.state.params.deckIdToEdit;
  const [mode, setMode] = React.useState('cards');
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
      <DeckHeader
        deck={deck}
        onPressBack={() => navigation.goBack()}
        mode={mode}
        onChangeMode={setMode}
      />
      <KeyboardAwareScrollView style={styles.scrollView} contentContainerStyle={{ flex: 1 }}>
        {mode === 'cards' ? <CardsGrid deck={deck} /> : null}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default CreateDeckScreen;
