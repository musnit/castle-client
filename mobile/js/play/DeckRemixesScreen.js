import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { DecksGrid } from '../components/DecksGrid';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useQuery, gql } from '@apollo/client';
import { CardCell } from './../components/CardCell';
import { useNavigation } from '../ReactNavigation';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  header: {
    paddingVertical: 32,
  },
  emptyCell: {
    width: '100%',
    flex: 1,
    borderRadius: Constants.CARD_SMALL_BORDER_RADIUS,
    backgroundColor: 'transparent',
    aspectRatio: Constants.CARD_RATIO,
  },
  sectionTitle: {
    marginTop: 16,
    alignItems: 'center',
  },
  sectionTitleLabel: {
    fontSize: 18,
    color: '#fff',
  },
});

export const DeckRemixesScreen = ({ route }) => {
  const deck = route?.params.deck;
  const parentDeckId = deck.deckId;
  const { push } = useNavigation();
  const insets = useSafeAreaInsets();
  const paddingBottom = Constants.iOS ? insets.bottom : insets.bottom + 50;
  let decks;

  const queryDecks = useQuery(
    gql`
      query ChildDecks($parentDeckId: ID!) {
        deck(deckId: $parentDeckId) {
          childDecks {
            id
            deckId
            title
            creator {
              userId
              username
              photo {
                url
              }
            }
            visibility
            initialCard {
              id
              cardId
              title
              backgroundColor
              backgroundImage {
                url
                smallUrl
              }
            }
            variables
            previewVideo {
              url
            }
          }
        }
      }
    `,
    { variables: { parentDeckId } }
  );

  if (!queryDecks.loading && !queryDecks.error && queryDecks.data) {
    decks = queryDecks.data.deck.childDecks;
  }

  const ListHeaderComponent = (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', paddingLeft: Constants.GRID_PADDING }}>
        <View style={[styles.emptyCell, Constants.styles.gridItem]} />
        <CardCell
          style={[Constants.styles.gridItem, { flex: 1 }]}
          card={deck.initialCard}
          visibility={deck.visibility}
          creator={deck.creator}
          onPress={() =>
            push(
              'PlayDeck',
              {
                decks: [deck],
                initialDeckIndex: 0,
              },
              {
                isFullscreen: true,
              }
            )
          }
          inGrid={true}
        />
        <View style={[styles.emptyCell, Constants.styles.gridItem]} />
      </View>
      <View style={styles.sectionTitle}>
        <Text style={styles.sectionTitleLabel}>
          {deck ? 'Remixes of @' + deck.creator.username + "'s deck" : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']}>
      <ScreenHeader title={'Remixes'} />
      {decks?.length ? (
        <DecksGrid
          decks={decks}
          contentContainerStyle={{ paddingBottom }}
          onPressDeck={(deck, index) =>
            push(
              'PlayDeck',
              {
                // TODO: support list of decks
                decks: [deck],
                initialDeckIndex: 0,
              },
              {
                isFullscreen: true,
              }
            )
          }
          ListHeaderComponent={ListHeaderComponent}
        />
      ) : null}
    </SafeAreaView>
  );
};
