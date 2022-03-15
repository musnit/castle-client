import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { CardCell } from '../components/CardCell';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNavigation, ANDROID_USE_NATIVE_NAVIGATION } from '../ReactNavigation';
import { useQuery, gql } from '@apollo/client';
import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';
import * as LocalId from '../common/local-id';

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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    padding: 8,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  deckTitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
});

const BlankDeckCell = ({ onPress }) => {
  return (
    <Pressable style={[Constants.styles.gridItem, { width: '33.3%' }]} onPress={onPress}>
      <View style={styles.blankDeckCell}>
        <FastImage
          style={{
            width: '100%',
            height: '100%',
          }}
          source={require('../../assets/images/CreateChooseKitScreen-blank.png')}
        />
      </View>
      <Text style={styles.deckTitle}>Blank</Text>
    </Pressable>
  );
};

const KitDeckCell = ({ deck, onPress }) => {
  return (
    <View style={[Constants.styles.gridItem, { width: '33.3%' }]}>
      <CardCell card={deck.initialCard} onPress={() => onPress(deck)} inGrid={true} />
      <Text style={styles.deckTitle}>{deck.title}</Text>
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
          title
          variables
          initialCard {
            id
            cardId
            sceneDataUrl
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
      {Platform.OS === 'android' && ANDROID_USE_NATIVE_NAVIGATION ? (
        <ScreenHeader title="New Deck" />
      ) : null}
      <View style={styles.textContainer}>
        <Text style={styles.text}>
          Start with a blank canvas{'\n'}
          or build with a kit?
        </Text>
      </View>
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
