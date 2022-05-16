import React from 'react';
import { Animated, Pressable, StyleSheet, View, Platform } from 'react-native';
import { Dropdown } from '../components/Dropdown';
import { shareDeck } from '../common/utilities';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation } from '../ReactNavigation';
import { isAdmin } from '../Session';
import { sendAsync } from '../core/CoreEvents';
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

export function getDropdownItems({
  isAnonymous,
  creatorUsername,
  isMe,
  onBlockUser,
  onReportDeck,
  isMuted,
  isRemixEnabled,
}) {
  let dropdownItems = [];

  dropdownItems.push({
    id: 'share',
    icon: Platform.OS === 'android' ? 'share-variant' : 'share',
    name: 'Share deck',
  });

  if (isRemixEnabled) {
    dropdownItems.push({
      id: 'remix',
      castleIcon: 'remix',
      name: 'Remix deck',
    });
  }

  dropdownItems.push({
    id: 'restart',
    icon: 'restart',
    name: 'Restart deck',
  });

  dropdownItems.push({
    id: 'mute',
    icon: isMuted ? 'volume-high' : 'volume-mute',
    name: isMuted ? 'Unmute sound' : 'Mute sound',
  });

  dropdownItems.push({
    id: 'view-source',
    icon: 'magnify',
    name: 'View deck source',
  });

  if (!isMe && onReportDeck) {
    dropdownItems.push({
      id: 'report',
      icon: 'flag-outline',
      name: 'Report and hide deck',
    });
  }
  if (!isMe && onBlockUser) {
    dropdownItems.push({
      id: 'block',
      icon: 'cancel',
      name: `Block @${creatorUsername}`,
    });
  }

  if (isAdmin()) {
    dropdownItems.push({
      id: 'staffPick',
      icon: 'castle',
      name: 'Admin: Add to staff picks',
      admin: true,
    });
  }
  if (isAdmin()) {
    dropdownItems.push({
      id: 'blacklistFeatured',
      icon: 'skull-outline',
      name: 'Admin: Blacklist in Home',
      admin: true,
    });
  }
  if (isAdmin()) {
    dropdownItems.push({
      id: 'blacklist',
      icon: 'skull',
      name: 'Admin: Blacklist',
      admin: true,
    });
  }

  return dropdownItems;
}

export function getOnSelectDropdownAction({
  deck,
  onBlockUser,
  onReportDeck,
  onSetIsMuted,
  isMuted,
}) {
  const navigation = useNavigation();
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

  const [remix] = useMutation(
    gql`
      mutation ($deckId: ID!) {
        remixDeck(deckId: $deckId) {
          deckId
        }
      }
    `
  );

  const onRemix = React.useCallback(async () => {
    await remix({
      variables: { deckId: deck.deckId },
    });

    // reset to top of current nav stack in order to unmount the view source editor
    if (navigation.canGoBack()) {
      await navigation.popToTop();
    }

    // ensure we're at the root/default screen of the Create tab
    await navigation.navigate('CreateTab');

    // push the new deck onto Create stack
    navigation.navigate('CreateTab', {
      screen: 'CreateDeck',
      params: {
        deckIdToEdit: deck.deckId,
        cardIdToEdit: undefined,
      },
    });
  }, [deck, navigation]);

  const maybeRemix = React.useCallback(() => {
    showActionSheetWithOptions(
      {
        title: `Save a private copy of @${deck.creator?.username}'s deck to your own profile?`,
        options: ['Save Copy', 'Cancel'],
        cancelButtonIndex: 1,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          return onRemix();
        }
      }
    );
  }, [showActionSheetWithOptions, onRemix, deck]);

  const onShare = React.useCallback(
    () =>
      shareDeck({
        deckId: deck.deckId,
      }),
    [deck]
  );

  const onRestartDeck = React.useCallback(
    () =>
      sendAsync('RESTART_DECK', {
        deckId: deck.deckId,
      }),
    [deck]
  );

  return React.useCallback(
    (id) => {
      switch (id) {
        case 'share': {
          onShare();
          break;
        }
        case 'remix': {
          maybeRemix();
          break;
        }
        case 'restart': {
          onRestartDeck();
          break;
        }
        case 'mute': {
          onSetIsMuted(!isMuted);
          break;
        }
        case 'view-source': {
          navigation.push('ViewSource', { deckIdToEdit: deck.deckId });
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
    [
      deck?.deckId,
      showActionSheetWithOptions,
      navigation,
      onBlockUser,
      onReportDeck,
      onSetIsMuted,
      isMuted,
      onShare,
      maybeRemix,
    ]
  );
}

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

  let playingTransition = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(playingTransition, {
      toValue: isPlaying ? 1 : 0,
      friction: 20,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [isPlaying]);

  let dropdownItems = getDropdownItems({
    isAnonymous,
    creatorUsername: creator.username,
    isRemixEnabled: deck.accessPermissions === 'cloneable',
    isMe,
    onBlockUser,
    onReportDeck,
    onSetIsMuted,
    isMuted,
  });

  const onSelectDropdownAction = getOnSelectDropdownAction({
    deck,
    onBlockUser,
    onReportDeck,
    onSetIsMuted,
    isMuted,
  });

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
