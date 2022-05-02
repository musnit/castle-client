import React from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  TouchableOpacity,
  Pressable,
  View,
  StyleSheet,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { CardCell } from '../components/CardCell';
import { CardsSet } from '../components/CardsSet';
import { RecoverUnsavedWorkAlert } from './RecoverUnsavedWorkAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { SegmentedNavigation } from '../components/SegmentedNavigation';

import * as LocalId from '../common/local-id';
import * as Session from '../Session';
import * as Utilities from '../common/utilities';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  settingsRow: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 8,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
    marginBottom: 16,
  },
  settingsColumn: {
    flexDirection: 'row',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  settingItemLabel: {
    color: Constants.colors.grayText,
    fontSize: 14,
    marginLeft: 2,
  },
  addCard: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 60,
    height: 84,
    borderRadius: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 1,
  },
  addCardIcon: {
    height: 22,
    width: 22,
    marginTop: 6,
    marginBottom: 8,
  },
  addCardLabel: {
    textAlign: 'center',
    textTransform: 'uppercase',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  caption: {
    fontSize: 16,
    color: Constants.colors.white,
    marginBottom: 16,
  },
  emptyCaption: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 16,
  },
  shareContent: {
    marginRight: 16,
    alignItems: 'flex-start',
  },
  shareTopCard: {
    flexShrink: 1,
    maxWidth: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareActions: {
    flexDirection: 'row',
  },
  shareButton: {
    ...Constants.styles.primaryButton,
    backgroundColor: '#000',
    borderColor: '#fff',
    borderWidth: 1,
    marginLeft: 8,
  },
  shareButtonLabel: {
    ...Constants.styles.primaryButtonLabel,
    color: '#fff',
    marginLeft: 4,
  },
});

const DECK_FRAGMENT = `
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
  caption
  playCount
  reactions {
    count
  }
  accessPermissions
  commentsEnabled
  parentDeckId
  parentDeck {
    creator { username }
    initialCard {
      backgroundImage { url }
    }
  }
  variables
  cards {
    id
    cardId
    sceneDataUrl
    title
    lastModified
    backgroundColor
    backgroundImage {
      url
      smallUrl
    }
    scene {
      data
      sceneId
    }
  }
  initialCard {
    id
    cardId
    sceneDataUrl
  }
`;

const CREATE_DECK_VIEW_MODE_KEY = `CreateDeckViewMode`;

const setViewModePreference = async (deckId, mode) => {
  if (!deckId || !mode) return;

  let preferences = await AsyncStorage.getItem(CREATE_DECK_VIEW_MODE_KEY);
  preferences = preferences ?? '{}';
  preferences = JSON.parse(preferences);
  preferences[deckId] = mode;
  return AsyncStorage.setItem(CREATE_DECK_VIEW_MODE_KEY, JSON.stringify(preferences));
};

const getViewModePreference = async (deckId) => {
  if (!deckId) return 'carousel';

  let preferences = await AsyncStorage.getItem(CREATE_DECK_VIEW_MODE_KEY);
  preferences = preferences ?? '{}';
  preferences = JSON.parse(preferences);
  const preference = preferences[deckId];
  return preference ?? 'carousel';
};

const CreateDeckHeader = ({ deck }) => {
  const navigation = useNavigation();

  if (!deck) return null;

  const initialCard = deck.cards.find((c) => c.cardId === deck.initialCard.cardId);
  const backgroundColor = Utilities.getCardBackgroundColor(initialCard);

  const onEditShareSettings = deck ? () => navigation.navigate('ShareDeck', { deck }) : null;

  return (
    <View style={styles.header}>
      <View style={styles.shareContent}>
        <Pressable onPress={onEditShareSettings}>
          {deck.caption ? (
            <Text style={styles.caption}>{deck.caption}</Text>
          ) : (
            <Text style={styles.emptyCaption}>Add a caption and #tags</Text>
          )}
        </Pressable>
        <View style={styles.shareActions}>
          <Pressable onPress={onEditShareSettings}>
            {deck.visibility === 'private' ? (
              <View style={Constants.styles.primaryButton}>
                <Text style={Constants.styles.primaryButtonLabel}>Share your deck</Text>
              </View>
            ) : (
              <View style={Constants.styles.primaryButton}>
                <Icon
                  name={
                    deck.visibility === 'private'
                      ? 'lock'
                      : deck.visibility === 'unlisted'
                      ? 'link'
                      : 'public'
                  }
                  size={18}
                  color="#000"
                  style={Constants.styles.primaryButtonIconLeft}
                />
                <Text style={Constants.styles.primaryButtonLabel}>Sharing</Text>
              </View>
            )}
          </Pressable>
          {deck.visibility !== 'private' ? (
            <Pressable
              style={({ pressed }) => [
                styles.shareButton,
                { backgroundColor: pressed ? '#333' : undefined },
              ]}
              onPress={() => Utilities.shareDeck(deck)}>
              <Feather name={Constants.iOS ? 'share' : 'share-2'} size={16} color="#fff" />
              <Text style={styles.shareButtonLabel}>Copy link</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={[styles.shareTopCard, { backgroundColor }]}>
        <CardCell card={initialCard} />
      </View>
    </View>
  );
};

const TAB_ITEMS = [
  {
    name: 'Detail',
    value: 'carousel',
  },
  {
    name: 'Grid',
    value: 'grid',
  },
];

export const CreateDeckScreen = (props) => {
  let lastFocusedTime;
  const navigation = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();
  const deckId = props.route.params.deckIdToEdit;
  const [deck, setDeck] = React.useState(null);
  const [viewMode, setViewMode] = React.useReducer((state, action) => {
    const { mode, deckId } = action;
    if (deckId) {
      setViewModePreference(deckId, mode);
    }
    return mode;
  }, 'carousel');

  if (!deckId || LocalId.isLocalId(deckId)) {
    throw new Error(`CreateDeckScreen requires an existing deck id`);
  }

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
    }, [deck, _refetch])
  );

  const _goBack = async () => {
    navigation.goBack();
  };

  React.useEffect(() => {
    if (!loadDeck.loading && !loadDeck.error && loadDeck.data) {
      setDeck(loadDeck.data.deck);
      (async () => {
        const viewModePreference = await getViewModePreference(loadDeck.data.deck.deckId);
        if (viewModePreference) {
          setViewMode({ mode: viewModePreference });
        }
      })();
    }
  }, [loadDeck.loading, loadDeck.error, loadDeck.data]);

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
    let destructiveButtonIndex;
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
          kitDeckId: undefined,
        });
      }
    },
    [deck, navigation]
  );

  const onPressNewCard = React.useCallback(
    () => _navigateToCreateCard({ cardId: LocalId.makeId() }),
    [_navigateToCreateCard]
  );

  const onSelectSegmentedNavItem = React.useCallback(
    (item) =>
      setViewMode({
        mode: item.value,
        deckId: deck?.deckId,
      }),
    [deck]
  );

  return (
    <SafeAreaView style={Constants.styles.container} edges={['left', 'right', 'bottom']}>
      <ScreenHeader title="Deck" onBackButtonPress={_goBack} />
      {loadDeck.loading && !deck ? (
        <ActivityIndicator size="large" color="#fff" style={{ padding: 48 }} />
      ) : (
        <>
          <CreateDeckHeader deck={deck} />
          <View style={styles.settingsRow}>
            <View style={styles.settingsColumn}>
              <SegmentedNavigation
                items={TAB_ITEMS}
                selectedItem={TAB_ITEMS.find((item) => item.value === viewMode)}
                onSelectItem={onSelectSegmentedNavItem}
                compact={true}
              />
            </View>
            <View style={styles.settingsColumn}>
              {deck && deck.playCount ? (
                <View style={styles.settingItem}>
                  <MCIcon name="play" size={16} color="#888" />
                  <Text style={styles.settingItemLabel}>{deck.playCount}</Text>
                </View>
              ) : null}
              {deck && deck.reactions?.length ? (
                <View style={styles.settingItem}>
                  <MCIcon name="fire" size={16} color="#888" />
                  <Text style={styles.settingItemLabel}>{deck.reactions[0].count}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <RecoverUnsavedWorkAlert context="backup" deckId={deck?.deckId} />
          <CardsSet
            deck={deck}
            onShowCardOptions={_showCardOptions}
            onPress={_navigateToCreateCard}
            mode={viewMode}
          />
          <TouchableOpacity style={styles.addCard} onPress={onPressNewCard}>
            <FastImage
              style={styles.addCardIcon}
              source={require('../../assets/images/create-card.png')}
            />
            <Text style={styles.addCardLabel}>Add Card</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
};
