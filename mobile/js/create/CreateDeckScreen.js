import React from 'react';
import gql from 'graphql-tag';
import { InteractionManager, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { CardsSet } from '../components/CardsSet';
import { DeckSettingsSheet } from './DeckSettingsSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { SheetBackgroundOverlay } from '../components/SheetBackgroundOverlay';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import { useActionSheet } from '@expo/react-native-action-sheet';

import * as Amplitude from 'expo-analytics-amplitude';
import * as LocalId from '../common/local-id';
import * as Session from '../Session';
import * as Utilities from '../common/utilities';

import Feather from 'react-native-vector-icons/Feather';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  layoutPicker: {
    flexDirection: 'row',
  },
  layoutButton: {
    margin: 6,
  },
  addCardButton: {
    position: 'absolute',
    right: 24,
    bottom: 48,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const DECK_FRAGMENT = `
  id
  deckId
  title
  visibility
  accessPermissions
  parentDeckId
  parentDeck {
    creator { username }
    initialCard {
      backgroundImage { url }
    }
  }
  previewVideo { url }
  cards {
    id
    cardId
    title
    lastModified
    backgroundImage {
      url
      smallUrl
      privateCardUrl
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

export const CreateDeckScreen = (props) => {
  let lastFocusedTime;
  const navigation = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();
  const deckId = props.route.params.deckIdToEdit;
  const [deck, setDeck] = React.useState(null);
  const [settingsSheetVisible, setSettingsSheetVisible] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('grid');

  if (!deckId || LocalId.isLocalId(deckId)) {
    throw new Error(`CreateDeckScreen requires an existing deck id`);
  }

  const [saveDeck] = useMutation(
    gql`
      mutation UpdateDeck($deck: DeckInput!) {
        updateDeckV2(deck: $deck) {
          ${DECK_FRAGMENT}
        }
      }
    `
  );

  const [deleteDeck] = useMutation(
    gql`
      mutation DeleteDeck($deckId: ID!) {
        deleteDeck(deckId: $deckId)
      }
    `
  );

  const [deleteCard] = useMutation(
    gql`
      mutation DeleteCard($cardId: ID!) {
        deleteCard(cardId: $cardId)
      }
    `
  );

  const [duplicateCard] = useMutation(
    gql`
      mutation DuplicateCard($cardId: ID!) {
        duplicateCard(cardId: $cardId) {
          ${Session.CARD_FRAGMENT}
        }
      }`
  );

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

  const _maybeSaveDeck = async () => {
    if (deck && deck.isChanged) {
      const deckUpdateFragment = {
        deckId,
        title: deck.title,
        // visibility: deck.visibility,
        accessPermissions: deck.accessPermissions,
      };
      saveDeck({ variables: { deck: deckUpdateFragment } });
      setDeck({ ...deck, isChanged: false });
    }
  };

  const openSettingsSheet = React.useCallback(() => setSettingsSheetVisible(true), []);
  const closeSettingsSheet = React.useCallback(() => {
    _maybeSaveDeck();
    setSettingsSheetVisible(false);
  }, [_maybeSaveDeck]);

  // kludge for https://github.com/apollographql/react-apollo/issues/3917
  const _refetch = React.useCallback(() => {
    const task = InteractionManager.runAfterInteractions(async () => {
      if (loadDeck?.refetch) return loadDeck.refetch();
    });
    return () => task.cancel();
  }, [loadDeck?.refetch]);

  useFocusEffect(
    React.useCallback(() => {
      if (lastFocusedTime) {
        _refetch();
      }
      lastFocusedTime = Date.now();
      return () => _maybeSaveDeck(); // save on blur
    }, [deck, _refetch])
  );

  const _goBack = async () => {
    await _maybeSaveDeck();
    navigation.goBack();
  };

  const _deleteDeck = async () => {
    await deleteDeck({ variables: { deckId } });
    _goBack();
  };

  if (!loadDeck.loading && !loadDeck.error && loadDeck.data && deck === null) {
    setDeck(loadDeck.data.deck);
  }

  const _changeDeck = (changes) => {
    setDeck({
      ...deck,
      ...changes,
      isChanged: true,
    });
  };

  const maybeDeleteCard = React.useCallback(
    (cardId) => {
      showActionSheetWithOptions(
        {
          title: 'Delete card?',
          options: ['Delete Card', 'Cancel'],
          destructiveButtonIndex: 0,
        },
        (index) => {
          if (index === 0) {
            const newCards = deck.cards.filter((c) => c.cardId !== cardId);
            deleteCard({ variables: { cardId } });
            setDeck({
              ...deck,
              cards: newCards,
            });
          }
        }
      );
    },
    [deleteCard, deck?.cards, setDeck, showActionSheetWithOptions]
  );

  const _showCardOptions = (card) => {
    let destructiveButtonIndex = undefined;
    let actions = [
      {
        name: 'Use as Top Card',
        action: async () => {
          const { deck: updatedDeck } = await Session.saveDeck(
            { ...card, makeInitialCard: true },
            { ...deck, initialCard: { cardId: card.cardId, id: card.id } }
          );
          setDeck(updatedDeck);
        },
      },
      {
        name: 'Duplicate Card',
        action: async () => {
          const newCard = await duplicateCard({ variables: { cardId: card.cardId } });
          setDeck({
            ...deck,
            cards: deck.cards.concat([newCard.data.duplicateCard]),
          });
        },
      },
    ];

    if (card.cardId !== deck.initialCard.cardId) {
      actions.push({
        name: 'Delete Card',
        action: () => maybeDeleteCard(card.cardId),
      });
      destructiveButtonIndex = actions.length - 1;
    }

    actions.push({
      name: 'Cancel',
      action: () => {},
    });

    showActionSheetWithOptions(
      {
        title: Utilities.makeCardPreviewTitle(card),
        options: actions.map((action) => action.name),
        destructiveButtonIndex,
        cancelButtonIndex: actions.length - 1,
      },
      async (buttonIndex) => {
        actions[buttonIndex].action();
      }
    );
  };

  const _navigateToCreateCard = React.useCallback(
    (card) => {
      if (deck?.deckId) {
        navigation.navigate('CreateDeck', {
          deckIdToEdit: deck.deckId,
          cardIdToEdit: card.cardId,
        });
      }
    },
    [deck]
  );

  const onPressNewCard = React.useCallback(
    () => _navigateToCreateCard({ cardId: LocalId.makeId() }),
    [_navigateToCreateCard]
  );

  const onChangeAccessPermissions = React.useCallback(
    async (accessPermissions) => {
      const deckUpdateFragment = { deckId, accessPermissions };
      saveDeck({ variables: { deck: deckUpdateFragment } });
      setDeck({ ...deck, accessPermissions });
    },
    [setDeck, saveDeck, deck]
  );

  return (
    <React.Fragment>
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title="Deck"
          onBackButtonPress={_goBack}
          rightIcon={deck ? 'public' : null}
          onRightButtonPress={deck ? () => navigation.navigate('ShareDeck', { deck }) : null}
        />
        <View style={styles.settingsRow}>
          <View style={styles.layoutPicker}>
            <TouchableOpacity
              style={styles.layoutButton}
              onPress={() => setViewMode('carousel')}
              hitSlop={{ top: 2, left: 2, bottom: 2, right: 2 }}>
              <MCIcon
                name="view-carousel"
                size={24}
                color={viewMode === 'carousel' ? '#fff' : '#888'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.layoutButton}
              onPress={() => setViewMode('grid')}
              hitSlop={{ top: 2, left: 2, bottom: 2, right: 2 }}>
              <Feather name="grid" size={20} color={viewMode === 'grid' ? '#fff' : '#888'} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={openSettingsSheet}>
            <MCIcon name="settings" size={24} color="#888" />
          </TouchableOpacity>
        </View>
        <CardsSet
          deck={deck}
          onShowCardOptions={_showCardOptions}
          onPress={_navigateToCreateCard}
          mode={viewMode}
        />
        <TouchableOpacity style={styles.addCardButton} onPress={onPressNewCard}>
          <MCIcon name="kabaddi" size={24} />
        </TouchableOpacity>
      </SafeAreaView>
      {settingsSheetVisible ? <SheetBackgroundOverlay onPress={closeSettingsSheet} /> : null}
      <DeckSettingsSheet
        isOpen={settingsSheetVisible}
        onClose={closeSettingsSheet}
        deck={deck}
        onChange={_changeDeck}
        onDeleteDeck={_deleteDeck}
        onChangeAccessPermissions={onChangeAccessPermissions}
      />
    </React.Fragment>
  );
};
