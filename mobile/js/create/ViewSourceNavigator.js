import React from 'react';
import { ViewSourceDeckScreen } from './ViewSourceDeckScreen';
import { useNavigation } from '../ReactNavigation';

import ViewSourceScreen from '../scenecreator/ViewSourceScreenDataProvider';

// switches between card and deck source
const ViewSourceContent = ({ deckId, cardId, ...props }) => {
  if (deckId && !cardId) {
    return <ViewSourceDeckScreen {...props} />;
  } else {
    return <ViewSourceScreen {...props} />;
  }
};

export const ViewSourceNavigator = (props) => {
  const navigation = useNavigation();

  let deckId, cardId;
  if (props.route && props.route.params) {
    const { params } = props.route;
    deckId = params.deckIdToEdit;
    cardId = params.cardIdToEdit;
  }

  return <ViewSourceContent deckId={deckId} cardId={cardId} {...props} />;
};
