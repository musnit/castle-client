import React from 'react';
import gql from 'graphql-tag';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useActionSheet } from '@expo/react-native-action-sheet';

import * as Session from './Session';
import * as Utilities from './utilities';

import CardsSet from './CardsSet';
import ConfigureDeck from './ConfigureDeck';
import DeckHeader from './DeckHeader';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

const DECK_FRAGMENT = `
  id
  deckId
  title
  isVisible
  cards {
    id
    cardId
    title
    updatedTime
    backgroundImage {
      url
      primaryColor
    }
    scene {
      data
      sceneId
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
  initialCard {
    id
    cardId
  }
`;

const CreateDeckScreen = (props) => {
  let lastFocusedTime;
  const navigation = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();
  const deckId = props.route.params.deckIdToEdit;
  const [mode, setMode] = React.useState('cards');
  const [deck, setDeck] = React.useState(null);

  const [saveDeck] = useMutation(
    gql`
      mutation UpdateDeck($deckId: ID!, $deck: DeckInput!) {
        updateDeck(deckId: $deckId, deck: $deck) {
          ${DECK_FRAGMENT}
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

  const [deleteCard] = useMutation(
    gql`
      mutation DeleteCard($cardId: ID!) {
        deleteCard(cardId: $cardId)
      }
    `
  );

  const [duplicateCard] = useMutation(
    gql`
      mutation DuplicateCard($cardId: ID!) {
        duplicateCard(cardId: $cardId) {
          ${Session.CARD_FRAGMENT}
        }
      }`
  );

  const loadDeck = useQuery(
    gql`
      query Deck($deckId: ID!) {
        deck(deckId: $deckId) {
          ${DECK_FRAGMENT}
        }
      }
    `,
    { variables: { deckId }, fetchPolicy: 'no-cache' }
  );

  const _maybeSaveDeck = async () => {
    if (deck && deck.isChanged) {
      const deckUpdateFragment = {
        title: deck.title,
        isVisible: deck.isVisible,
      };
      saveDeck({ variables: { deckId, deck: deckUpdateFragment } });
      setDeck({ ...deck, isChanged: false });
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (lastFocusedTime) {
        loadDeck.refetch();
      }
      lastFocusedTime = Date.now();
      return () => _maybeSaveDeck(); // save on blur
    }, [deck])
  );

  const _goBack = async () => {
    await _maybeSaveDeck();
    navigation.goBack();
  };

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

  const _showCardOptions = (card) => {
    showActionSheetWithOptions(
      {
        title: Utilities.makeCardPreviewTitle(card),
        options: ['Use as Top Card', 'Duplicate Card', 'Delete Card', 'Cancel'],
        destructiveButtonIndex: 2,
        cancelButtonIndex: 3,
      },
      async (buttonIndex) => {
        if (buttonIndex == 0) {
          const { deck: updatedDeck } = await Session.saveDeck(
            { ...card, makeInitialCard: true },
            { ...deck, initialCard: { cardId: card.cardId, id: card.id } }
          );
          setDeck(updatedDeck);
        } else if (buttonIndex == 1) {
          const newCard = await duplicateCard({ variables: { cardId: card.cardId } });
          setDeck({
            ...deck,
            cards: deck.cards.concat([newCard.data.duplicateCard]),
          });
        } else if (buttonIndex == 2) {
          const newCards = deck.cards.filter((c) => c.cardId !== card.cardId);
          deleteCard({ variables: { cardId: card.cardId } });
          setDeck({
            ...deck,
            cards: newCards,
          });
        }
      }
    );
  };

  const _navigateToCreateCard = (card) => {
    navigation.navigate('CreateDeck', {
      deckIdToEdit: deck.deckId,
      cardIdToEdit: card.cardId,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <DeckHeader
        deck={deck}
        onPressBack={_goBack}
        mode={mode}
        onChangeDeck={_changeDeck}
        onChangeMode={(mode) => {
          _maybeSaveDeck();
          return setMode(mode);
        }}
      />
      {mode === 'cards' ? (
        <CardsSet
          showNewCard
          deck={deck}
          onShowCardOptions={_showCardOptions}
          onPress={_navigateToCreateCard}
        />
      ) : (
        <ConfigureDeck deck={deck} onChange={_changeDeck} onDeleteDeck={_deleteDeck} />
      )}
    </SafeAreaView>
  );
};

export default CreateDeckScreen;
