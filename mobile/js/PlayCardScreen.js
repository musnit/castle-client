import React from 'react';
import gql from 'graphql-tag';
import { TouchableWithoutFeedback, ScrollView, StyleSheet, View } from 'react-native';
import { useQuery, useEffect } from '@apollo/react-hooks';
import { useNavigation } from '@react-navigation/native';
import SafeAreaView from 'react-native-safe-area-view';
import { useSafeArea } from 'react-native-safe-area-context';

import CardBlocks from './CardBlocks';
import CardScene from './CardScene';
import Viewport from './viewport';

import * as Constants from './Constants';
import * as Session from './Session';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
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

const PlayCardScreen = ({
  deckId,
  cardId,
  onSelectNewCard,
  interactionEnabled,
  onToggleInteraction,
  route,
}) => {
  const navigation = useNavigation();
  if (!deckId && route.params) {
    deckId = route.params.deckId;
    cardId = route.params.cardId;
  }

  if (!deckId) {
    throw new Error(`Can't play a deck with no deckId`);
  }

  let card;
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

  const _handleSelectBlock = (blockId) => {
    const block = card.blocks.find((b) => b.cardBlockId === blockId);
    if (block.type === 'choice') {
      onSelectNewCard({ deckId, cardId: block.destinationCardId });
    }
  };

  const { vw, vh } = Viewport;
  const insets = useSafeArea();
  const cardHeight = (1 / Constants.CARD_RATIO) * 100 * vw;
  const tabBarHeight = 49;

  let statusBarHeight = 0;
  if (vh * 100 >= cardHeight + insets.top) {
    statusBarHeight = insets.top;
  }

  const everythingHeight = statusBarHeight + cardHeight + tabBarHeight + insets.bottom;
  const heightDifference = everythingHeight - vh * 100 - statusBarHeight;

  let blocksBottomPadding = 12;
  if (heightDifference > 0) {
    blocksBottomPadding = blocksBottomPadding + heightDifference;
  }

  return card ? (
    <View style={styles.container}>
      <CardScene
        interactionEnabled={interactionEnabled}
        key={`card-scene-${card.scene && card.scene.sceneId}`}
        style={styles.scene}
        card={card}
      />
      <View
        pointerEvents="box-none"
        style={[styles.description, { paddingBottom: blocksBottomPadding }]}>
        <CardBlocks
          card={card}
          onSelectBlock={_handleSelectBlock}
          interactionEnabled={interactionEnabled}
          onToggleInteraction={onToggleInteraction}
        />
      </View>
    </View>
  ) : null;
};

export default PlayCardScreen;
