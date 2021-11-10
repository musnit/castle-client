import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Amplitude } from '@amplitude/react-native';
import { CardScene } from '../game/CardScene';
import { CardText } from '../components/CardText';
import { gql } from '@apollo/client';
import { sendAsync, useListen } from '../core/CoreEvents';

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
  textActors: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 8,
  },
});

const recordDeckPlay = (deckId, cardId) =>
  Session.apolloClient.mutate({
    mutation: gql`
      mutation RecordDeckPlay($deckId: ID!, $cardId: ID) {
        recordDeckPlay(deckId: $deckId, cardId: $cardId)
      }
    `,
    variables: {
      deckId,
      cardId,
    },
  });

export const PlayDeck = ({ deck, visibility, route, paused }) => {
  const playingCardId = React.useRef(deck.initialCard?.cardId);
  useListen({
    eventName: 'DID_NAVIGATE_TO_CARD',
    handler: ({ cardId }) => (playingCardId.current = cardId),
  });

  React.useEffect(() => {
    Amplitude.getInstance().logEvent('VIEW_PLAY_DECK', { deckId: deck.deckId, visibility });

    return () => {
      recordDeckPlay(deck.deckId, playingCardId.current);
    };
  }, [deck.deckId, visibility]);

  React.useEffect(() => {
    recordDeckPlay(deck.deckId, playingCardId.current);
    let interval = setInterval(() => {
      recordDeckPlay(deck.deckId, playingCardId.current);
    }, 10 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [playingCardId.current]);

  const [textActors, setTextActors] = React.useState([]);
  useListen({
    eventName: 'TEXT_ACTORS_DATA',
    handler: ({ data }) => {
      const { textActors } = JSON.parse(data);
      setTextActors(textActors);
    },
  });

  const selectActor = React.useCallback((actorId) => {
    sendAsync('SELECT_ACTOR', {
      actorId,
    });
  }, []);

  return (
    <View style={styles.container}>
      <CardScene
        deck={deck}
        interactionEnabled={true}
        key={`deck-scene-${deck.deckId}`}
        style={styles.scene}
        paused={paused}
      />
      <View pointerEvents="box-none" style={styles.textActors}>
        <CardText visible textActors={textActors} onSelect={selectActor} />
      </View>
    </View>
  );
};
