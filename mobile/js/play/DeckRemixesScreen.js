import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { DecksGrid } from '../components/DecksGrid';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, gql } from '@apollo/client';
import { CardCell } from './../components/CardCell';
import { useNavigation } from '../ReactNavigation';
import { UserAvatar } from './../components/UserAvatar';

import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  header: {
    paddingVertical: 32,
  },
  backButton: {
    position: 'absolute',
    top: 24,
    left: 12,
  },
  emptyCell: {
    width: '100%',
    flex: 1,
    borderRadius: Constants.CARD_SMALL_BORDER_RADIUS,
    backgroundColor: 'transparent',
    aspectRatio: Constants.CARD_RATIO,
  },
  avatar: {
    width: 48,
    height: 48,
    position: 'absolute',
    bottom: 0,
    left: -10,
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
  const { push, pop } = useNavigation();
  const insets = useSafeAreaInsets();
  const paddingBottom = insets.bottom + 64;
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
      <Pressable style={styles.backButton} onPress={() => pop()}>
        <Icon name="arrow-back" size={32} color="#fff" />
      </Pressable>
      <View style={{ flexDirection: 'row', paddingLeft: Constants.GRID_PADDING }}>
        <View style={[styles.emptyCell, Constants.styles.gridItem]} />
        <View style={[Constants.styles.gridItem, { flex: 1 }]}>
          <CardCell
            card={deck.initialCard}
            visibility={deck.visibility}
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
          <View style={styles.avatar} pointerEvents="none">
            <UserAvatar url={deck.creator.photo?.url} />
          </View>
        </View>
        <View style={[styles.emptyCell, Constants.styles.gridItem]} />
      </View>
      <View style={styles.sectionTitle}>
        <Text style={styles.sectionTitleLabel}>
          Remixes of<Text style={{ fontWeight: 'bold' }}> @{deck.creator.username}</Text>'s deck
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']}>
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
