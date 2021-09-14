import React from 'react';
import { CreateDeckScreen } from './CreateDeckScreen';
import { useNavigation } from '../ReactNavigation';

import CreateCardScreen from '../scenecreator/CreateCardScreenDataProvider';

import * as Amplitude from 'expo-analytics-amplitude';

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

  let deckId, cardId;
  if (props.route && props.route.params) {
    const { params } = props.route;
    deckId = params.deckIdToEdit;
    cardId = params.cardIdToEdit;
  }

  React.useEffect(() => {
    if (deckId) {
      Amplitude.logEventWithProperties('VIEW_CREATE_DECK', { deckId });
    }
  }, [deckId]);

  return <CreateDeckContent deckId={deckId} cardId={cardId} {...props} />;
};
