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

const PlayDeckNavigator = ({ deckId, cardId, interactionEnabled, onToggleInteraction, route }) => {
  const navigation = useNavigation();
  if (!deckId && route.params) {
    deckId = route.params.deckId;
    cardId = route.params.cardId;
  }

  const [currDeckId, setCurrDeckId] = useState(deckId);
  const [currCardId, setCurrCardId] = useState(cardId);
  const [hasSelectedNewCard, setHasSelectedNewCard] = useState(false);

  const onSelectNewCard = ({ deckId, cardId }) => {
    if (deckId) {
      setCurrDeckId(deckId);
    }
    setCurrCardId(cardId);
    setHasSelectedNewCard(true);
  };

  const transitionRef = React.useRef();
  const [counter, setCounter] = React.useState(1);
  React.useEffect(() => {
    const isInitial = !hasSelectedNewCard && currDeckId === deckId && currCardId === cardId;
    if (!isInitial && transitionRef.current) {
      transitionRef.current.animateNextTransition();
      setCounter(counter + 1);
    }
  }, [currDeckId, currCardId, hasSelectedNewCard]);

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
            interactionEnabled={interactionEnabled}
            onToggleInteraction={onToggleInteraction}
          />
        ),
        [counter, interactionEnabled, onToggleInteraction]
      )}
    </Transitioning.View>
  );
};

export default PlayDeckNavigator;
