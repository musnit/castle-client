import React from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { CardsSet } from '../components/CardsSet';
import { DeckSettingsSheet } from './DeckSettingsSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { SheetBackgroundOverlay } from '../components/SheetBackgroundOverlay';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { SegmentedNavigation } from '../components/SegmentedNavigation';

import * as Amplitude from 'expo-analytics-amplitude';
import * as LocalId from '../common/local-id';
import * as Session from '../Session';
import * as Utilities from '../common/utilities';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  settingsRow: {
    backgroundColor: '#000',
    marginTop: -1, // hide the border built into ScreenHeader
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 8,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
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
  previewVideo { url }
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

export const CreateDeckScreen = (props) => {
  let lastFocusedTime;
  const navigation = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();
  const deckId = props.route.params.deckIdToEdit;
  const [deck, setDeck] = React.useState(null);
  const [settingsSheetVisible, setSettingsSheetVisible] = React.useState(false);
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

  const [saveDeck] = useMutation(
    gql`
      mutation UpdateDeck($deck: DeckInput!) {
        updateDeckV2(deck: $deck) {
          ${DECK_FRAGMENT}
        }
      }
    `,
    {
      update: (cache, { data }) => {
        // clear comments cache in case they modified the comment enabled flag
        // https://www.apollographql.com/docs/react/caching/cache-interaction/#example-deleting-a-field-from-a-cached-object
        cache.modify({
          id: cache.identify(deck),
          fields: {
            comments(_, { DELETE }) {
              return DELETE;
            },
          },
        });
      },
    }
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
    [setDeck, saveDeck, deck, deckId]
  );

  const onChangeCommentsEnabled = React.useCallback(
    async (commentsEnabled) => {
      const deckUpdateFragment = { deckId, commentsEnabled };
      saveDeck({ variables: { deck: deckUpdateFragment } });
      setDeck({ ...deck, commentsEnabled });
    },
    [setDeck, saveDeck, deck, deckId]
  );

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

  return (
    <React.Fragment>
      <SafeAreaView style={Constants.styles.container} edges={['top']}>
        <ScreenHeader
          title="Deck"
          onBackButtonPress={_goBack}
          RightButtonComponent={
            deck ? (
              <TouchableOpacity
                style={Constants.styles.siteHeaderButton}
                onPress={deck ? () => navigation.navigate('ShareDeck', { deck }) : null}>
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
                  <Text style={Constants.styles.primaryButtonLabel}>Share</Text>
                </View>
              </TouchableOpacity>
            ) : null
          }
        />
        {loadDeck.loading && !deck ? (
          <ActivityIndicator size="large" color="#fff" style={{ padding: 48 }} />
        ) : (
          <>
            <View style={styles.settingsRow}>
              <View style={styles.settingsColumn}>
                <SegmentedNavigation
                  items={TAB_ITEMS}
                  selectedItem={TAB_ITEMS.find((item) => item.value === viewMode)}
                  onSelectItem={(item) =>
                    setViewMode({
                      mode: item.value,
                      deckId: deck.deckId,
                    })
                  }
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
                <Pressable onPress={openSettingsSheet} style={styles.settingItem}>
                  {({ pressed }) => (
                    <FeatherIcon name="settings" size={16} color={pressed ? '#333' : '#888'} />
                  )}
                </Pressable>
              </View>
            </View>
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
      {settingsSheetVisible ? <SheetBackgroundOverlay onPress={closeSettingsSheet} /> : null}
      <DeckSettingsSheet
        isOpen={settingsSheetVisible}
        onClose={closeSettingsSheet}
        deck={deck}
        onChange={_changeDeck}
        onDeleteDeck={_deleteDeck}
        onChangeAccessPermissions={onChangeAccessPermissions}
        onChangeCommentsEnabled={onChangeCommentsEnabled}
      />
    </React.Fragment>
  );
};
