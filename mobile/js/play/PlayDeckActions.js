import React from 'react';
import { Platform } from 'react-native';
import { blockUser, reportDeck, DECK_REPORT_REASONS } from '../moderation/ModerationActions';
import { isAdmin, useSession } from '../Session';
import { sendAsync } from '../core/CoreEvents';
import { shareDeck } from '../common/utilities';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation } from '../ReactNavigation';
import { useMutation, gql } from '@apollo/client';
import * as Analytics from '../common/Analytics';

const getDropdownItems = ({ deck, isMe, isMuted }) => {
  let dropdownItems = [];

  const creatorUsername = deck?.creator?.username;
  const isRemixEnabled = deck?.accessPermissions === 'cloneable';

  dropdownItems.push({
    id: 'share',
    icon: Platform.OS === 'android' ? 'share-variant' : 'share',
    name: 'Share deck',
  });

  if (isRemixEnabled) {
    dropdownItems.push({
      id: 'remix',
      icon: 'shuffle-variant',
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

  if (!isMe) {
    dropdownItems.push({
      id: 'report',
      icon: 'flag-outline',
      name: 'Report and hide deck',
    });
  }
  if (!isMe) {
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
};

export const usePlayDeckActions = ({ deck, isMe }) => {
  const { isMuted, setIsMuted } = useSession();
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
    const result = await remix({
      variables: { deckId: deck.deckId },
    });
    const remixDeckId = result?.data?.remixDeck?.deckId;
    if (!remixDeckId) {
      return;
    }

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
        deckIdToEdit: remixDeckId,
        cardIdToEdit: undefined,
      },
    });

    Analytics.logEventSkipAmplitude('REMIX_DECK', {
      deckId: deck?.deckId,
    });
  }, [deck, navigation, remix]);

  const maybeRemix = React.useCallback(() => {
    showActionSheetWithOptions(
      {
        title: `Start a remix of @${deck.creator?.username}'s deck and copy it to your create screen?`,
        options: ['Remix', 'Cancel'],
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

  const onReportDeck = React.useCallback(
    ({ reason }) => reportDeck({ deckId: deck.deckId, reason }),
    [deck]
  );

  const onBlockUser = React.useCallback(() => {
    if (deck?.creator?.userId) {
      blockUser(deck.creator.userId, true);
    }
  }, [deck]);

  const onSetIsMuted = React.useCallback(
    (isMuted) => {
      setIsMuted(isMuted);
      sendAsync('SET_SOUND_ENABLED', { enabled: isMuted ? false : true });
    },
    [setIsMuted]
  );

  const onSelectItem = React.useCallback(
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
          Analytics.logEventSkipAmplitude('RESTART_DECK', {
            deckId: deck?.deckId,
          });
          break;
        }
        case 'mute': {
          Analytics.logEventSkipAmplitude('MUTE_DECK', {
            deckId: deck?.deckId,
            isMuted: !isMuted,
          });
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
                Analytics.logEventSkipAmplitude('BLOCK_USER', {
                  deckId: deck?.deckId,
                });
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
                showActionSheetWithOptions(
                  {
                    title: `What is wrong with this deck?`,
                    options: DECK_REPORT_REASONS.map((reason) => reason.label).concat(['Cancel']),
                    cancelButtonIndex: DECK_REPORT_REASONS.length,
                  },
                  (buttonIndex) => {
                    if (buttonIndex !== DECK_REPORT_REASONS.length) {
                      onReportDeck({ reason: DECK_REPORT_REASONS[buttonIndex].id });
                      Analytics.logEventSkipAmplitude('REPORT_DECK', {
                        deckId: deck?.deckId,
                      });
                    }
                  }
                );
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
      onAddStaffPick,
      onBlacklistDeck,
      onBlacklistDeckFromFeatured,
      onRestartDeck,
    ]
  );

  return {
    items: getDropdownItems({ deck, isMe, isMuted }),
    onSelectItem,
  };
};
