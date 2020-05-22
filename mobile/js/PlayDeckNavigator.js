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
  const [hasSelectedNewCard, setHasSelectedNewCard] = useState(false);
  const [playDeckState, changePlayDeckState] = React.useReducer((state, changes) => {
    return {
      ...state,
      ...changes,
    };
  }, initialDeckState || EMPTY_PLAY_DECK_STATE);

  const onSelectNewCard = ({ cardId }) => {
    setHasSelectedNewCard(true);
    setCardId(cardId);
  };

  return (
    <View
      style={[
        styles.container,
        {
          // When at the first card, show the underlying deck preview
          backgroundColor: !hasSelectedNewCard ? 'transparent' : 'black',
        },
      ]}>
      <CardTransition deckId={deckId} cardId={cardId} style={styles.prevCard}>
        <PlayCardScreen
          deckId={deckId}
          cardId={cardId}
          onSelectNewCard={onSelectNewCard}
          deckState={playDeckState}
          onChangeDeckState={changePlayDeckState}
          paused={paused}
        />
      </CardTransition>
    </View>
  );
};

export default PlayDeckNavigator;
