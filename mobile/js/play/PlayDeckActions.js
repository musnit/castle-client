import React from 'react';
import { Animated, Pressable, StyleSheet, View, Text } from 'react-native';
import { Dropdown } from '../components/Dropdown';
import { shareDeck } from '../common/utilities';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation } from '../ReactNavigation';
import { isAdmin } from '../Session';
import { useMutation, gql } from '@apollo/client';

import * as Constants from '../Constants';
const CastleIcon = Constants.CastleIcon;

const ICON_SIZE = 22;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: Constants.FEED_ITEM_HEADER_HEIGHT,
    width: '100%',
    borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginLeft: 16,
  },
});

export const PlayDeckActions = ({
  deck,
  isPlaying,
  onPressBack,
  disabled,
  onBlockUser,
  onReportDeck,
  onSetIsMuted,
  isMe = false,
  isMuted = false,
  isAnonymous = false,
}) => {
  const { creator } = deck;
  const { push } = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();

  const [addCurationPolicy] = useMutation(
    gql`
      mutation ($deckId: ID!, $type: DeckCurationPolicyType!) {
        adminAddDeckCurationPolicy(deckId: $deckId, type: $type, platform: all)
      }
    `
  );

  const onBlacklistDeck = React.useCallback(
    () =>
      addCurationPolicy({
        variables: { deckId: deck.deckId, type: 'blacklist' },
      }),
    [addCurationPolicy, deck]
  );

  const onBlacklistDeckFromFeatured = React.useCallback(
    () =>
      addCurationPolicy({
        variables: { deckId: deck.deckId, type: 'blacklistFeaturedOnly' },
      }),
    [addCurationPolicy, deck]
  );

  const [addStaffPick] = useMutation(
    gql`
      mutation ($deckId: ID!) {
        adminAddStaffPick(deckId: $deckId)
      }
    `
  );

  const onAddStaffPick = React.useCallback(
    () =>
      addStaffPick({
        variables: { deckId: deck.deckId },
      }),
    [addStaffPick, deck]
  );

  let playingTransition = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(playingTransition, {
      toValue: isPlaying ? 1 : 0,
      friction: 20,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [isPlaying]);

  let dropdownItems = [];
  if (!isAnonymous) {
    // TODO: enable anonymous view source
    dropdownItems.push({
      id: 'view-source',
      icon: 'search',
      name: 'View deck source',
    });
  }
  if (!isMe && onReportDeck) {
    dropdownItems.push({
      id: 'report',
      icon: 'flag',
      name: 'Report and hide this deck',
    });
  }

  if (isAdmin()) {
    dropdownItems.push({
      id: 'blacklist',
      icon: 'flag',
      name: '(Admin) Blacklist',
    });
  }

  if (isAdmin()) {
    dropdownItems.push({
      id: 'blacklistFeatured',
      icon: 'flag',
      name: '(Admin) Blacklist from featured',
    });
  }

  if (!isMe && onBlockUser) {
    dropdownItems.push({
      id: 'block',
      icon: 'block',
      name: `Block @${creator.username}`,
    });
  }
  dropdownItems.push({
    id: 'mute',
    icon: isMuted ? 'volume-up' : 'volume-off',
    name: isMuted ? 'Turn on sound' : 'Mute',
  });

  if (isAdmin()) {
    dropdownItems.push({
      id: 'staffPick',
      icon: 'star',
      name: '(Admin) Add to staff picks',
    });
  }

  const onSelectDropdownAction = React.useCallback(
    (id) => {
      switch (id) {
        case 'mute': {
          onSetIsMuted(!isMuted);
          break;
        }
        case 'view-source': {
          push('ViewSource', { deckIdToEdit: deck.deckId });
          break;
        }
        case 'block': {
          showActionSheetWithOptions(
            {
              title: `Block this person?`,
              options: ['Block', 'Cancel'],
              destructiveButtonIndex: 0,
              cancelButtonIndex: 1,
            },
            (buttonIndex) => {
              if (buttonIndex === 0) {
                onBlockUser();
              }
            }
          );
          break;
        }
        case 'report': {
          showActionSheetWithOptions(
            {
              title: `Does this deck violate our community guidelines? Let us know and we will not show it to you anymore.`,
              options: ['Report and hide', 'Cancel'],
              destructiveButtonIndex: 0,
              cancelButtonIndex: 1,
            },
            (buttonIndex) => {
              if (buttonIndex === 0) {
                onReportDeck();
              }
            }
          );
          break;
        }
        case 'blacklist': {
          showActionSheetWithOptions(
            {
              title: `Hides this deck everywhere in the app`,
              options: ['Blacklist', 'Cancel'],
              destructiveButtonIndex: 0,
              cancelButtonIndex: 1,
            },
            (buttonIndex) => {
              if (buttonIndex === 0) {
                onBlacklistDeck();
              }
            }
          );
          break;
        }
        case 'blacklistFeatured': {
          showActionSheetWithOptions(
            {
              title: `Hides this deck only on the main feed`,
              options: ['Blacklist from featured', 'Cancel'],
              destructiveButtonIndex: 0,
              cancelButtonIndex: 1,
            },
            (buttonIndex) => {
              if (buttonIndex === 0) {
                onBlacklistDeckFromFeatured();
              }
            }
          );
          break;
        }
        case 'staffPick': {
          showActionSheetWithOptions(
            {
              title: `Add this deck to the staff picks feed`,
              options: ['Add', 'Cancel'],
              cancelButtonIndex: 1,
            },
            (buttonIndex) => {
              if (buttonIndex === 0) {
                onAddStaffPick();
              }
            }
          );
          break;
        }
      }
    },
    [deck?.deckId, onBlockUser, onReportDeck, onSetIsMuted, isMuted]
  );

  return (
    <Animated.View
      style={{
        ...styles.container,
        paddingHorizontal: 16,
        opacity: playingTransition,
      }}>
      <View style={styles.row}>
        <Pressable style={styles.back} onPress={onPressBack}>
          {({ pressed }) => (
            <CastleIcon name="back" color={pressed ? '#ccc' : '#fff'} size={ICON_SIZE} />
          )}
        </Pressable>
      </View>
      <View style={styles.row} pointerEvents={disabled ? 'none' : 'auto'}>
        <Dropdown
          style={styles.rightButton}
          labeledItems={dropdownItems}
          onChange={onSelectDropdownAction}>
          <CastleIcon name="overflow" color="#fff" size={ICON_SIZE} />
        </Dropdown>
        <Pressable style={styles.rightButton} onPress={() => shareDeck(deck)}>
          {({ pressed }) => (
            <CastleIcon
              name={Constants.iOS ? 'share-ios' : 'share-android'}
              color={pressed ? '#ccc' : '#fff'}
              size={ICON_SIZE}
            />
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
};
