import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CardCell } from '../components/CardCell';
import { useNavigation } from '../ReactNavigation';
import { useQuery, gql } from '@apollo/client';

import * as Constants from '../Constants';
import * as LocalId from '../common/local-id';
import { ScreenHeader } from '../components/ScreenHeader';

const styles = StyleSheet.create({
  gridContainer: {
    paddingTop: Constants.GRID_PADDING * 2,
    paddingLeft: Constants.GRID_PADDING,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  blankDeckCell: {
    width: '100%',
    aspectRatio: Constants.CARD_RATIO,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 16,
  },
});

const BlankDeckCell = ({ onPress }) => {
  return (
    <Pressable style={[Constants.styles.gridItem, { width: '33.3%' }]} onPress={onPress}>
      <View style={styles.blankDeckCell}>
        <Text style={styles.label}>Blank</Text>
      </View>
    </Pressable>
  );
};

const KitDeckCell = ({ deck, onPress }) => {
  return (
    <View style={[Constants.styles.gridItem, { width: '33.3%' }]}>
      <CardCell card={deck.initialCard} onPress={() => onPress(deck)} inGrid={true} />
    </View>
  );
};

export const CreateChooseKitScreen = () => {
  const { navigate } = useNavigation();

  let decks = null;
  const fetchKitDecks = useQuery(
    gql`
      query {
        kitDecks {
          id
          deckId
          initialCard {
            id
            cardId
            backgroundColor
            backgroundImage {
              url
              smallUrl
            }
          }
        }
      }
    `
  );

  if (!fetchKitDecks.loading && !fetchKitDecks.error && fetchKitDecks.data) {
    decks = fetchKitDecks.data.kitDecks;
  }

  const onPressBlankDeck = () =>
    navigate(
      'CreateDeck',
      {
        deckIdToEdit: LocalId.makeId(),
        cardIdToEdit: LocalId.makeId(),
      },
      { isFullscreen: true }
    );

  const onPressKitDeck = ({ deckId }) =>
    navigate(
      'CreateDeck',
      {
        deckIdToEdit: LocalId.makeId(),
        cardIdToEdit: LocalId.makeId(),
        kitDeckId: deckId,
      },
      { isFullscreen: true }
    );

  return (
    <>
      {Platform.OS === 'android' && <ScreenHeader title="Choose Your Deck" />}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        <BlankDeckCell onPress={onPressBlankDeck} />
        {decks
          ? decks.map((deck) => (
              <KitDeckCell key={`create-kit-${deck.deckId}`} deck={deck} onPress={onPressKitDeck} />
            ))
          : null}
      </ScrollView>
    </>
  );
};
