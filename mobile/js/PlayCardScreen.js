import React from 'react';
import gql from 'graphql-tag';
import { TouchableWithoutFeedback, ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@apollo/react-hooks';
import { useNavigation } from 'react-navigation-hooks';

import CardHeader from './CardHeader';
import CardBlocks from './CardBlocks';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
    flexShrink: 1,
    backgroundColor: '#f2f2f2',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  scene: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  description: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
});

const PlayCardScreen = (props) => {
  const navigation = useNavigation();

  let deckId,
    cardId,
    deck,
    card = {};
  if (navigation.state.params) {
    deckId = navigation.state.params.deckId;
    cardId = navigation.state.params.cardId;
  }
  if (!deckId) {
    throw new Error(`Can't play a deck with no deckId`);
  }
  const query = useQuery(
    gql`
      query GetDeckById($deckId: ID!) {
        deck(deckId: $deckId) {
          deckId
          title
          cards {
            cardId
            title
            blocks {
              cardBlockId
              cardBlockUpdateId
              type
              title
              destinationCardId
            }
          }
          initialCard {
            cardId
          }
        }
      }
    `,
    {
      variables: { deckId },
      fetchPolicy: 'no-cache',
    }
  );
  if (!query.loading && !query.error && query.data) {
    deck = query.data.deck;
    cardId = cardId || deck.initialCard.cardId;
    card = deck.cards.find((c) => c.cardId === cardId);
  }

  const _handlePressScene = () => {
    // TODO: go to scene for this card
  };

  const _handleSelectBlock = (blockId) => {
    const block = card.blocks.find((b) => b.cardBlockId === blockId);
    if (block.type === 'choice') {
      navigation.navigate('PlayCard', { deckId: deck.deckId, cardId: block.destinationCardId });
    }
  };

  // we don't use SafeAreaView because it does not respond to StatusBar being hidden
  // https://github.com/facebook/react-native/pull/20999
  return (
    <View style={styles.container}>
      <CardHeader card={card} onPressBack={() => navigation.navigate('HomeScreen')} />
      <ScrollView style={styles.scrollView} contentContainerStyle={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={_handlePressScene}>
          <View style={styles.scene} />
        </TouchableWithoutFeedback>
        <View style={styles.description}>
          <CardBlocks card={card} onSelectBlock={_handleSelectBlock} />
        </View>
      </ScrollView>
    </View>
  );
};

export default PlayCardScreen;
