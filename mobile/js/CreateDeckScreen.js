import React from 'react';
import gql from 'graphql-tag';
import { View, StyleSheet, Text } from 'react-native';
import SafeAreaView from 'react-native-safe-area-view';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { useNavigation, useNavigationEvents } from 'react-navigation-hooks';

import CardsSet from './CardsSet';
import ConfigureDeck from './ConfigureDeck';
import DeckHeader from './DeckHeader';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

const CreateDeckScreen = (props) => {
  let lastFocusedTime;
  const navigation = useNavigation();
  const deckId = navigation.state.params.deckIdToEdit;
  const [mode, setMode] = React.useState('cards');
  const [deck, setDeck] = React.useState(null);

  const [saveDeck] = useMutation(
    gql`
      mutation UpdateDeck($deckId: ID!, $deck: DeckInput!) {
        updateDeck(deckId: $deckId, deck: $deck) {
          deckId
          title
          cards {
            cardId
            title
            backgroundImage {
              url
            }
          }
        }
      }
    `
  );

  const [deleteDeck] = useMutation(
    gql`
      mutation DeleteDeck($deckId: ID!) {
        deleteDeck(deckId: $deckId)
      }
    `
  );

  const loadDeck = useQuery(
    gql`
      query Deck($deckId: ID!) {
        deck(deckId: $deckId) {
          deckId
          title
          cards {
            cardId
            title
            backgroundImage {
              url
            }
          }
        }
      }
    `,
    { variables: { deckId }, fetchPolicy: 'no-cache' }
  );

  const _maybeSaveDeck = async () => {
    if (deck.isChanged) {
      const deckUpdateFragment = {
        title: deck.title,
      };
      saveDeck({ variables: { deckId, deck: deckUpdateFragment } });
      setDeck({ ...deck, isChanged: false });
    }
  };

  useNavigationEvents((event) => {
    if (event.type == 'didFocus') {
      if (lastFocusedTime) {
        loadDeck.refetch();
      }
      lastFocusedTime = Date.now();
    } else if (event.type == 'willBlur') {
      _maybeSaveDeck();
    }
  });

  // we use `dangerouslyGetParent()` because
  // CreateDeckScreen is presented inside its own switch navigator,
  // which is itself inside the higher-level stack navigator which brought us here.
  const _goBack = () => navigation.dangerouslyGetParent().goBack();

  const _deleteDeck = async () => {
    await deleteDeck({ variables: { deckId } });
    _goBack();
  };

  if (!loadDeck.loading && !loadDeck.error && loadDeck.data && deck === null) {
    setDeck(loadDeck.data.deck);
  }

  const _changeDeck = (changes) => {
    setDeck({
      ...deck,
      ...changes,
      isChanged: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <DeckHeader
        deck={deck}
        onPressBack={_goBack}
        mode={mode}
        onChangeMode={(mode) => {
          _maybeSaveDeck();
          return setMode(mode);
        }}
      />
      {mode === 'cards' ? (
        <CardsSet
          deck={deck}
          onPress={(card) =>
            navigation.navigate('CreateCard', {
              deckIdToEdit: deck.deckId,
              cardIdToEdit: card.cardId,
            })
          }
        />
      ) : (
        <ConfigureDeck deck={deck} onChange={_changeDeck} onDeleteDeck={_deleteDeck} />
      )}
    </SafeAreaView>
  );
};

export default CreateDeckScreen;
