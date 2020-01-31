import React from 'react';
import gql from 'graphql-tag';
import { TouchableWithoutFeedback, ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@apollo/react-hooks';
import { useNavigation } from 'react-navigation-hooks';
import SafeAreaView from 'react-native-safe-area-view';

import CardBlocks from './CardBlocks';
import CardHeader from './CardHeader';
import CardScene from './CardScene';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
    flexShrink: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
  },
  scene: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  description: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
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
            backgroundImage {
              fileId
              url
            }
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

  return (
    <SafeAreaView style={styles.container}>
      <CardHeader card={card} onPressBack={() => navigation.navigate('HomeScreen')} />
      <ScrollView style={styles.scrollView} contentContainerStyle={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={_handlePressScene}>
          <CardScene style={styles.scene} card={card} />
        </TouchableWithoutFeedback>
        <View style={styles.description}>
          <CardBlocks card={card} onSelectBlock={_handleSelectBlock} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PlayCardScreen;
