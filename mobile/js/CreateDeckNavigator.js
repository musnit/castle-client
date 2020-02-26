import React from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Transitioning, Transition } from 'react-native-reanimated';

import * as Constants from './Constants';

import CreateDeckScreen from './CreateDeckScreen';
import CreateCardScreen from './CreateCardScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

const transition = (
  <Transition.Together>
    <Transition.Out type="fade" durationMs={300} />
    <Transition.Together>
      <Transition.In type="scale" durationMs={300} interpolation="easeOut" />
      <Transition.In type="fade" durationMs={150} delayMs={150} />
    </Transition.Together>
  </Transition.Together>
);

// switches between card creator and deck creator
const CreateDeckContent = ({ deckId, cardId, ...props }) => {
  if (deckId && !cardId) {
    return <CreateDeckScreen {...props} />;
  } else {
    return <CreateCardScreen {...props} />;
  }
};

const CreateDeckNavigator = (props) => {
  const navigation = useNavigation();
  const transitionRef = React.useRef();
  const [counter, setCounter] = React.useState(1);

  let deckId, cardId;
  if (props.route && props.route.params) {
    const { params } = props.route;
    deckId = params.deckIdToEdit;
    cardId = params.cardIdToEdit;
  }

  React.useEffect(() => {
    if (transitionRef.current) {
      transitionRef.current.animateNextTransition();
      setCounter(counter + 1);
    }
  }, [deckId, cardId]);

  return (
    <Transitioning.View ref={transitionRef} transition={transition} style={styles.container}>
      {React.useMemo(
        () => (
          <CreateDeckContent key={counter} deckId={deckId} cardId={cardId} {...props} />
        ),
        [counter]
      )}
    </Transitioning.View>
  );
};

export default CreateDeckNavigator;
