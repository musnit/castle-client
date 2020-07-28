import React from 'react';
import gql from 'graphql-tag';
import { TouchableWithoutFeedback, ScrollView, StyleSheet, View } from 'react-native';
import { CardScene } from '../game/CardScene';
import { CardText } from '../components/CardText';
import { useQuery, useEffect } from '@apollo/react-hooks';
import { useNavigation } from '@react-navigation/native';
import SafeAreaView from 'react-native-safe-area-view';
import { getPaneData } from '../Tools';
import { useSafeArea } from 'react-native-safe-area-context';

import * as GhostUI from '../ghost/GhostUI';
import * as GhostEvents from '../ghost/GhostEvents';

import Viewport from '../viewport';

import * as Constants from '../Constants';
import * as Session from '../Session';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: Constants.CARD_BORDER_RADIUS,
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
    padding: 16,
  },
});

const PlayCardScreenDataProvider = ({ deckId, cardId, route, ...props }) => {
  const navigation = useNavigation(); // we use props.route
  if (!deckId && route?.params) {
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
              scene {
                data
                sceneId
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

  return (
    <GhostUI.Provider>
      <PlayCardScreen card={card} {...props} />
    </GhostUI.Provider>
  );
};

const TEXT_ACTORS_PANE = 'sceneCreatorTextActors';

const PlayCardScreen = ({ card, onSelectNewCard, deckState, onChangeDeckState, paused }) => {
  const { root } = GhostUI.useGhostUI();

  let textActors;
  if (root && root.panes) {
    const data = getPaneData(root.panes[TEXT_ACTORS_PANE]);
    if (data) {
      textActors = data.textActors;
    }
  }

  const _handleSceneMessage = (message) => {
    switch (message.messageType) {
      case 'CHANGE_DECK_STATE': {
        onChangeDeckState(message.data);
        break;
      }
    }
  };

  const selectActor = React.useCallback((actorId) => {
    GhostEvents.sendAsync('SELECT_ACTOR', {
      actorId,
    });
  }, []);

  GhostEvents.useListen({
    eventName: 'NAVIGATE_TO_CARD',
    handler: ({ card }) => {
      onSelectNewCard(card);
    },
  });

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
        interactionEnabled={true}
        key={`card-scene-${card.scene && card.scene.sceneId}`}
        style={styles.scene}
        card={card}
        deckState={deckState}
        onMessage={_handleSceneMessage}
        paused={paused}
      />
      <View
        pointerEvents="box-none"
        style={[styles.description, { paddingBottom: blocksBottomPadding }]}>
        <CardText
          visible
          card={card}
          textActors={textActors}
          onSelect={selectActor}
          deckState={deckState}
        />
      </View>
    </View>
  ) : null;
};

export default PlayCardScreenDataProvider;
