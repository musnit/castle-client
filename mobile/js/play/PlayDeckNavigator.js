import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';

import CardTransition from './CardTransition';

import * as History from '../common/history';

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

const EMPTY_PLAY_DECK_STATE = {
  variables: [],
};

export const PlayDeckNavigator = ({ deckId, initialDeckState, initialCardId, route, paused }) => {
  const navigation = useNavigation(); // we use props.route
  if (!deckId && route.params) {
    deckId = route.params.deckId;
    initialCardId = route.params.initialCardId;
    initialDeckState = route.params.initialDeckState;
  }

  const [cardState, setCardState] = useState({
    cardId: initialCardId,
    numCardsViewed: 1,
  });
  const [playDeckState, changePlayDeckState] = React.useReducer((state, changes) => {
    return {
      ...state,
      ...changes,
    };
  }, initialDeckState || EMPTY_PLAY_DECK_STATE);

  const onSelectNewCard = React.useCallback(
    ({ cardId }) => {
      setCardState({
        cardId,
        numCardsViewed: cardState.numCardsViewed + 1,
      });
    },
    [cardState.numCardsViewed]
  );

  React.useEffect(() => {
    History.addItem(deckId);
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          // When at the first card, show the underlying deck preview
          backgroundColor: cardState.numCardsViewed < 2 ? 'transparent' : 'black',
        },
      ]}>
      <CardTransition
        deckId={deckId}
        cardId={cardState.cardId}
        counter={cardState.numCardsViewed}
        style={styles.card}
        onSelectNewCard={onSelectNewCard}
        deckState={playDeckState}
        onChangeDeckState={changePlayDeckState}
        paused={paused}
      />
    </View>
  );
};
