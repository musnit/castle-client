import React from 'react';
import { InteractionManager, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Transitioning } from 'react-native-reanimated';

import CardTransition from './CardTransition';
import CreateDeckScreen from './CreateDeckScreen';
import CreateCardScreen from './CreateCardScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

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
    const promise = InteractionManager.runAfterInteractions(() => {
      if (transitionRef.current) {
        transitionRef.current.animateNextTransition();
        setCounter(counter + 1);
      }
    });
    return () => {
      promise.cancel();
    };
  }, [deckId, cardId]);

  return (
    <Transitioning.View ref={transitionRef} transition={CardTransition} style={styles.container}>
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
