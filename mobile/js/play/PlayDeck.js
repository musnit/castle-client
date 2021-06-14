import React from 'react';
import { StyleSheet, View } from 'react-native';
import { gql } from '@apollo/client';
import { useNavigation } from '../ReactNavigation';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Session from '../Session';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
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

export const PlayDeck = ({ deckId, visibility, route, paused }) => {
  const navigation = useNavigation(); // we use props.route
  if (!deckId && route.params) {
    deckId = route.params.deckId;
  }

  React.useEffect(() => {
    Amplitude.logEventWithProperties('VIEW_PLAY_DECK', { deckId, visibility });

    return () => {
      // TODO: can't record deck play until we have card id from the engine
      // recordDeckPlay(deckId, cardIdRef.current);
    };
  }, [deckId, visibility]);

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

  // TODO: DeckScene, TextActors
  return (
    <View style={styles.container}>
      {/* <CardTransition
        deckId={deckId}
        cardId={cardState.cardId}
        counter={cardState.numCardsViewed}
        style={styles.card}
        onSelectNewCard={onSelectNewCard}
        deckState={playDeckState}
        onChangeDeckState={changePlayDeckState}
        paused={paused}
        /> */}
    </View>
  );
};
