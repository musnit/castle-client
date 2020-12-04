import React from 'react';
import { InteractionManager, StyleSheet } from 'react-native';
import { CreateDeckScreen } from './CreateDeckScreen';
import { useNavigation } from '../ReactNavigation';
import { Transitioning } from 'react-native-reanimated';

import CreateCardScreen from '../scenecreator/CreateCardScreenDataProvider';

import * as Amplitude from 'expo-analytics-amplitude';

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

export const CreateDeckNavigator = (props) => {
  const navigation = useNavigation();

  let deckId,
    cardId,
    initialDeckState,
    initialIsEditing = true;
  if (props.route && props.route.params) {
    const { params } = props.route;
    deckId = params.deckIdToEdit;
    cardId = params.cardIdToEdit;
    initialDeckState = params.initialDeckState;
    if (params.initialIsEditing === false) {
      initialIsEditing = params.initialIsEditing;
    }
  }

  React.useEffect(() => {
    Amplitude.logEventWithProperties('VIEW_CREATE_DECK', { deckId });
  }, [deckId]);

  return (
    <CreateDeckContent
      deckId={deckId}
      cardId={cardId}
      initialIsEditing={initialIsEditing}
      {...props}
    />
  );
};
