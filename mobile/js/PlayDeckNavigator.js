import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Transitioning } from 'react-native-reanimated';

import CardTransition from './CardTransition';
import PlayCardScreen from './PlayCardScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const EMPTY_PLAY_DECK_STATE = {
  variables: [],
};

const PlayDeckNavigator = ({ deckId, initialDeckState, initialCardId, route }) => {
  const navigation = useNavigation();
  if (!deckId && route.params) {
    deckId = route.params.deckId;
    initialCardId = route.params.initialCardId;
    initialDeckState = route.params.initialDeckState;
  }

  const [currCardId, setCurrCardId] = useState(initialCardId);
  const [hasSelectedNewCard, setHasSelectedNewCard] = useState(false);
  const [playDeckState, changePlayDeckState] = React.useReducer((state, changes) => {
    return {
      ...state,
      ...changes,
    };
  }, initialDeckState || EMPTY_PLAY_DECK_STATE);

  const onSelectNewCard = ({ cardId }) => {
    setCurrCardId(cardId);
    setHasSelectedNewCard(true);
  };

  const transitionRef = React.useRef();
  const [counter, setCounter] = React.useState(1);
  React.useEffect(() => {
    const isInitial = !hasSelectedNewCard && currCardId === initialCardId;
    if (!isInitial && transitionRef.current) {
      transitionRef.current.animateNextTransition();
      setCounter(counter + 1);
    }
  }, [currCardId, hasSelectedNewCard]);

  return (
    <Transitioning.View
      ref={transitionRef}
      transition={CardTransition}
      style={[
        styles.container,
        {
          // When at the first card, show the underlying deck preview
          backgroundColor: counter === 1 ? 'transparent' : 'black',
        },
      ]}>
      {React.useMemo(
        () => (
          <PlayCardScreen
            key={counter}
            deckId={deckId}
            cardId={currCardId}
            onSelectNewCard={onSelectNewCard}
            deckState={playDeckState}
            onChangeDeckState={changePlayDeckState}
          />
        ),
        [counter, playDeckState]
      )}
    </Transitioning.View>
  );
};

export default PlayDeckNavigator;
