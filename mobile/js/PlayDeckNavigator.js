import React from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Transitioning } from 'react-native-reanimated';

import CardTransition from './CardTransition';
import PlayCardScreen from './PlayCardScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

const PlayDeckNavigator = (props) => {
  const navigation = useNavigation();
  const transitionRef = React.useRef();
  const [counter, setCounter] = React.useState(1);

  let deckId, cardId;
  if (props.route && props.route.params) {
    const { params } = props.route;
    deckId = params.deckId;
    cardId = params.cardId;
  }

  React.useEffect(() => {
    if (transitionRef.current) {
      transitionRef.current.animateNextTransition();
      setCounter(counter + 1);
    }
  }, [deckId, cardId]);

  return (
    <Transitioning.View ref={transitionRef} transition={CardTransition} style={styles.container}>
      {React.useMemo(
        () => (
          <PlayCardScreen key={counter} {...props} />
        ),
        [counter]
      )}
    </Transitioning.View>
  );
};

export default PlayDeckNavigator;
