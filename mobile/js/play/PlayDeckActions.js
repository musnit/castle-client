import React from 'react';
import { Animated, Pressable, StyleSheet, View, Text } from 'react-native';
import { Dropdown } from '../components/Dropdown';
import { shareDeck } from '../common/utilities';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation } from '../ReactNavigation';

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
  isMe = false,
  isAnonymous = false,
}) => {
  const { creator } = deck;
  const { push } = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();

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
  if (!isMe && onBlockUser) {
    dropdownItems.push({
      id: 'block',
      icon: 'block',
      name: `Block @${creator.username}`,
    });
  }

  const onSelectDropdownAction = React.useCallback(
    (id) => {
      switch (id) {
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
      }
    },
    [deck?.deckId, onBlockUser, onReportDeck]
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
