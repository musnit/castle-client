import React from 'react';
import { useNavigation } from '@react-navigation/native';

import CreateDeckScreen from './CreateDeckScreen';
import CreateCardScreen from './CreateCardScreen';

// switches between card creator and deck creator
const CreateDeckNavigator = (props) => {
  const navigation = useNavigation();
  let deckId, cardId;
  if (props.route && props.route.params) {
    const { params } = props.route;
    deckId = params.deckIdToEdit;
    cardId = params.cardIdToEdit;
  }
  if (deckId && !cardId) {
    return <CreateDeckScreen {...props} />;
  } else {
    return <CreateCardScreen {...props} />;
  }
};

export default CreateDeckNavigator;
