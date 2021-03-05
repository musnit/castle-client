import React from 'react';
import gql from 'graphql-tag';
import { ActivityIndicator, Alert, TouchableOpacity, View } from 'react-native';
import { CardsSet } from '../components/CardsSet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import { ScreenHeader } from '../components/ScreenHeader';

import * as LocalId from '../common/local-id';

import * as Constants from '../Constants';

import Icon from 'react-native-vector-icons/MaterialIcons';

const DECK_FRAGMENT = `
  id
  deckId
  title
  accessPermissions
  creator {
    username
  }
  parentDeckId
  parentDeck {
    creator { username }
    initialCard {
      backgroundImage { url }
    }
  }
  cards {
    id
    cardId
    title
    lastModified
    backgroundImage {
      url
      smallUrl
      primaryColor
    }
    scene {
      data
      sceneId
    }
  }
  initialCard {
    id
    cardId
  }
`;

export const ViewSourceDeckScreen = (props) => {
  let lastFocusedTime;
  const navigation = useNavigation();
  const deckId = props.route.params.deckIdToEdit;
  const [deck, setDeck] = React.useState(null);

  if (!deckId || LocalId.isLocalId(deckId)) {
    throw new Error(`ViewSourceDeckScreen requires an existing deck id`);
  }

  const loadDeck = useQuery(
    gql`
      query Deck($deckId: ID!) {
        deck(deckId: $deckId) {
          ${DECK_FRAGMENT}
        }
      }
    `,
    { variables: { deckId }, fetchPolicy: 'no-cache' }
  );

  useFocusEffect(
    React.useCallback(() => {
      if (lastFocusedTime) {
        loadDeck.refetch();
      }
      lastFocusedTime = Date.now();
    }, [deck])
  );

  if (!loadDeck.loading && !loadDeck.error && loadDeck.data && deck === null) {
    setDeck(loadDeck.data.deck);
  }

  const _navigateToCard = (card) => {
    navigation.navigate('ViewSource', {
      deckIdToEdit: deck.deckId,
      cardIdToEdit: card.cardId,
    });
  };

  return (
    <SafeAreaView style={Constants.styles.container}>
      <ScreenHeader
        title={deck ? deck.creator.username + "'s deck" : ''}
        onBackButtonPress={() => navigation.goBack()}
        RightButtonComponent={
          deck && deck.accessPermissions !== 'cloneable' ? (
            <TouchableOpacity
              style={Constants.styles.siteHeaderIcon}
              onPress={() => {
                Alert.alert(
                  'Viewing source',
                  "You are viewing the source for this deck. You can see how it works, but you can't save changes."
                );
              }}>
              <Icon name="help-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ) : null
        }
      />
      {loadDeck.loading && !deck ? (
        <ActivityIndicator size="large" color="#fff" style={{ padding: 48 }} />
      ) : (
        <CardsSet deck={deck} onPress={_navigateToCard} />
      )}
    </SafeAreaView>
  );
};
