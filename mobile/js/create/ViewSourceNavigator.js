import React from 'react';
import { InteractionManager, StyleSheet } from 'react-native';
import { ViewSourceDeckScreen } from './ViewSourceDeckScreen';
import { useNavigation } from '../Navigation';
import { Transitioning } from 'react-native-reanimated';

import ViewSourceScreen from '../scenecreator/ViewSourceScreenDataProvider';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

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
