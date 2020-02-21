import React from 'react';
import gql from 'graphql-tag';
import { TouchableWithoutFeedback, ScrollView, StyleSheet, View } from 'react-native';
import { useQuery, useEffect } from '@apollo/react-hooks';
import { useNavigation } from '@react-navigation/native';
import SafeAreaView from 'react-native-safe-area-view';

import CardBlocks from './CardBlocks';
import CardHeader from './CardHeader';
import CardScene from './CardScene';
import Viewport from './viewport';
import * as Session from './Session';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cardBody: {
    // contains just the 16:9 card as a child
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    aspectRatio: 0.5625, // 16:9
    backgroundColor: '#8CA5CD',
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
    card = {};
  if (props.route.params) {
    deckId = props.route.params.deckId;
    cardId = props.route.params.cardId;
  }
  if (!deckId) {
    throw new Error(`Can't play a deck with no deckId`);
  }

  let query;
  if (cardId) {
    query = useQuery(
      gql`
        query GetCardById($cardId: ID!) {
          card(cardId: $cardId) {
            id
            cardId
            title
            backgroundImage {
              fileId
              url
            }
            scene {
              sceneId
              data
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
        }
      `,
      {
        variables: { cardId },
      }
    );

    if (!query.loading && !query.error && query.data) {
      card = query.data.card;
    }
  } else {
    query = useQuery(
      gql`
        query GetDeckById($deckId: ID!) {
          deck(deckId: $deckId) {
            initialCard {
              id
              cardId
              title
              backgroundImage {
                fileId
                url
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
          }
        }
      `,
      {
        variables: { deckId },
      }
    );

    if (!query.loading && !query.error && query.data) {
      let deck = query.data.deck;
      cardId = deck.initialCard.cardId;
      card = deck.initialCard;
    }
  }

  if (!query.loading && !query.error) {
    Session.prefetchCardsAsync({ cardId });
  }

  const _handlePressScene = () => {
    // TODO: go to scene for this card
  };

  const _handleSelectBlock = (blockId) => {
    const block = card.blocks.find((b) => b.cardBlockId === blockId);
    if (block.type === 'choice') {
      navigation.navigate('PlayCard', { deckId, cardId: block.destinationCardId });
    }
  };

  const containScrollViewStyles = Viewport.isUltraWide ? { width: '100%' } : { height: '100%' };

  return (
    <SafeAreaView style={styles.container}>
      <CardHeader card={card} onPressBack={() => navigation.navigate('HomeScreen')} />
      <View style={styles.cardBody}>
        <ScrollView
          style={[styles.scrollView, containScrollViewStyles]}
          contentContainerStyle={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={_handlePressScene}>
            <CardScene
              key={`card-scene-${card.scene && card.scene.sceneId}`}
              style={styles.scene}
              card={card}
            />
          </TouchableWithoutFeedback>
          <View style={styles.description}>
            <CardBlocks card={card} onSelectBlock={_handleSelectBlock} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default PlayCardScreen;
