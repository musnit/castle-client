import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import CardTransition from './CardTransition';
import PlayCardScreen from './PlayCardScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  prevCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});

const EMPTY_PLAY_DECK_STATE = {
  variables: [],
};

const PlayDeckNavigator = ({ deckId, initialDeckState, initialCardId, route, paused }) => {
  if (!deckId && route.params) {
    deckId = route.params.deckId;
    initialCardId = route.params.initialCardId;
    initialDeckState = route.params.initialDeckState;
  }

  const [cardId, setCardId] = useState(initialCardId);
  const [playDeckState, changePlayDeckState] = React.useReducer((state, changes) => {
    return {
      ...state,
      ...changes,
    };
  }, initialDeckState || EMPTY_PLAY_DECK_STATE);

  const onSelectNewCard = ({ cardId }) => {
    setCardId(cardId);
  };

  return (
    <View style={styles.container}>
      <PlayCardScreen
        deckId={deckId}
        cardId={cardId}
        onSelectNewCard={onSelectNewCard}
        deckState={playDeckState}
        onChangeDeckState={changePlayDeckState}
        paused={paused}
      />
      <CardTransition deckId={deckId} cardId={cardId} style={styles.prevCard} />
    </View>
  );
};

export default PlayDeckNavigator;
