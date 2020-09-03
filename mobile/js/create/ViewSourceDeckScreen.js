import React from 'react';
import gql from 'graphql-tag';
import { View, StyleSheet, Text } from 'react-native';
import { CardsSet } from '../components/CardsSet';
import { ViewSourceDeckHeader } from './ViewSourceDeckHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect } from '../Navigation';

import * as LocalId from '../common/local-id';

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
  creator {
    username
  }
  cards {
    id
    cardId
    title
    updatedTime
    backgroundImage {
      url
      smallUrl
      privateCardUrl
      primaryColor
    }
    scene {
      data
      sceneId
    }
  }
  initialCard {
    id
    cardId
  }
`;

export const ViewSourceDeckScreen = (props) => {
  let lastFocusedTime;
  const navigation = useNavigation();
  const deckId = props.route.params.deckIdToEdit;
  const [deck, setDeck] = React.useState(null);

  if (!deckId || LocalId.isLocalId(deckId)) {
    throw new Error(`ViewSourceDeckScreen requires an existing deck id`);
  }

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

  useFocusEffect(
    React.useCallback(() => {
      if (lastFocusedTime) {
        loadDeck.refetch();
      }
      lastFocusedTime = Date.now();
    }, [deck])
  );

  if (!loadDeck.loading && !loadDeck.error && loadDeck.data && deck === null) {
    setDeck(loadDeck.data.deck);
  }

  const _navigateToCard = (card) => {
    navigation.navigate('ViewSource', {
      deckIdToEdit: deck.deckId,
      cardIdToEdit: card.cardId,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ViewSourceDeckHeader deck={deck} onPressBack={() => navigation.goBack()} />
      <CardsSet deck={deck} onPress={_navigateToCard} />
    </SafeAreaView>
  );
};
