import React from 'react';
import { useNavigation } from '@react-navigation/native';

import * as Constants from './Constants';

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
    if (cardId === Constants.CREATE_NEW_CARD_ID) {
      cardId = null;
    }
    return <CreateCardScreen {...props} />;
  }
};

export default CreateDeckNavigator;
