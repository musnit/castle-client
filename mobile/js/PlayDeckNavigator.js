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

const PlayDeckNavigator = ({ deckId, cardId, route }) => {
  const navigation = useNavigation();
  if (!deckId && route.params) {
    deckId = route.params.deckId;
    cardId = route.params.cardId;
  }

  const [currDeckId, setCurrDeckId] = useState(deckId);
  const [currCardId, setCurrCardId] = useState(cardId);

  const onSelectNewCard = ({ deckId, cardId }) => {
    if (deckId) {
      setCurrDeckId(deckId);
    }
    setCurrCardId(cardId);
  };

  const transitionRef = React.useRef();
  const [counter, setCounter] = React.useState(1);
  React.useEffect(() => {
    if (!(currDeckId === deckId && currCardId === cardId) && transitionRef.current) {
      transitionRef.current.animateNextTransition();
      setCounter(counter + 1);
    }
  }, [currDeckId, currCardId]);

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
            deckId={currDeckId}
            cardId={currCardId}
            onSelectNewCard={onSelectNewCard}
          />
        ),
        [counter]
      )}
    </Transitioning.View>
  );
};

export default PlayDeckNavigator;
