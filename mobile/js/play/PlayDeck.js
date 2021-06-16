import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CardScene } from '../game/CardScene';
import { CardText } from '../components/CardText';
import { gql } from '@apollo/client';
import { sendAsync, useListen } from '../core/CoreEvents';

import * as Amplitude from 'expo-analytics-amplitude';
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
  React.useEffect(() => {
    Amplitude.logEventWithProperties('VIEW_PLAY_DECK', { deckId: deck.deckId, visibility });

    return () => {
      // TODO: can't record deck play until we have card id from the engine
      // recordDeckPlay(deckId, cardIdRef.current);
    };
  }, [deck.deckId, visibility]);

  // TODO: can't record deck play until we have card id from the engine
  /* React.useEffect(() => {
    recordDeckPlay(deckId, cardState.cardId);
    let interval = setInterval(() => {
      recordDeckPlay(deckId, cardState.cardId);
    }, 10 * 1000);

    return () => {
      clearInterval(interval);
    };
    }, [cardState.cardId]); */

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
