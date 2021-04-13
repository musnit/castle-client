import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Dropdown } from '../components/Dropdown';
import { shareDeck } from '../common/utilities';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation } from '../ReactNavigation';
import { UserAvatar } from '../components/UserAvatar';

import Icon from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { gql } from '@apollo/client';

import * as Constants from '../Constants';
import * as Session from '../Session';

const AVATAR_SIZE = 28;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  back: {
    marginRight: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatarSkeleton: {
    backgroundColor: '#595959',
    borderRadius: 14,
  },
  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
    ...Constants.styles.textShadow,
  },
  usernameSkeleton: {
    backgroundColor: '#595959',
    height: 8,
    width: 100,
    marginLeft: 8,
  },
  remixIcon: {
    marginLeft: 8,
    ...Constants.styles.textShadow,
  },
  rightButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  rightButtonIcon: {
    ...Constants.styles.textShadow,
  },
});

export const PlayDeckActionsSkeleton = () => {
  return (
    <>
      <View style={[styles.avatar, styles.avatarSkeleton]}></View>
      <View style={styles.usernameSkeleton}></View>
    </>
  );
};

export const PlayDeckActions = ({
  deck,
  isPlaying,
  onPressBack,
  disabled,
  backgroundColor,
  additionalPadding,
  onBlockUser,
  onReportDeck,
  isMe = false,
  isAnonymous = false,
}) => {
  const { creator } = deck;
  const { push, navigate } = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();

  const navigateToParent = React.useCallback(async () => {
    const result = await Session.apolloClient.query({
      query: gql`
          query GetDeckById($deckId: ID!) {
            deck(deckId: $deckId) {
              ${Constants.FEED_ITEM_DECK_FRAGMENT}
            }
          }
        `,
      variables: { deckId: deck.parentDeckId },
    });
    if (result?.data?.deck && result.data.deck.visibility == 'public') {
      return navigate('PlayDeck', {
        decks: [result.data.deck],
        initialDeckIndex: 0,
        title: 'Remixed deck',
      });
    }
  }, [deck.parentDeckId, navigate]);

  let creatorTransform = React.useRef(new Animated.Value(0)).current;
  const creatorTransformX = creatorTransform.interpolate({
    inputRange: [0, 1],
    outputRange: [-(8 + AVATAR_SIZE), -additionalPadding],
  });

  React.useEffect(() => {
    Animated.spring(creatorTransform, {
      toValue: isPlaying ? 1 : 0,
      friction: 20,
      tension: 70,
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
              if (buttonIndex == 0) {
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
              if (buttonIndex == 0) {
                onReportDeck();
              }
            }
          );
          break;
        }
      }
    },
    [deck?.deckId, onBlockUser]
  );

  return (
    <View
      style={{
        ...styles.container,
        backgroundColor: backgroundColor,
        paddingHorizontal: isPlaying ? 12 + additionalPadding : 12,
      }}>
      <Animated.View
        style={{
          ...styles.row,
          flex: -1,
          paddingRight: 16,
          transform: [{ translateX: creatorTransformX }],
        }}>
        <Pressable style={styles.back} onPress={onPressBack}>
          {({ pressed }) => (
            <Animated.View style={{ opacity: creatorTransform }}>
              <Icon name="arrow-back" color={pressed ? '#ccc' : '#fff'} size={32} />
            </Animated.View>
          )}
        </Pressable>
        <Pressable
          disabled={disabled}
          style={styles.row}
          onPress={() => push('Profile', { userId: creator.userId })}>
          <View style={styles.avatar}>
            <UserAvatar url={creator.photo?.url} />
          </View>
          <Text style={styles.username}>{creator.username}</Text>
        </Pressable>
        {deck.parentDeckId && deck.parentDeck && (
          <View style={{ ...styles.row, flex: 1 }}>
            <Feather name="refresh-cw" color="#fff" size={14} style={styles.remixIcon} />
            <Pressable disabled={disabled} onPress={navigateToParent}>
              <Text numberOfLines={1} style={styles.username}>
                {deck.parentDeck?.creator?.username}
              </Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
      <View style={styles.row} pointerEvents={disabled ? 'none' : 'auto'}>
        <Dropdown
          style={styles.rightButton}
          labeledItems={dropdownItems}
          onChange={onSelectDropdownAction}>
          <Feather name="more-horizontal" color="#fff" size={24} style={styles.rightButtonIcon} />
        </Dropdown>
        <Pressable style={styles.rightButton} onPress={() => shareDeck(deck)}>
          {({ pressed }) => (
            <Feather
              name={Constants.iOS ? 'share' : 'share-2'}
              color={pressed ? '#ccc' : '#fff'}
              size={24}
              style={styles.rightButtonIcon}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
};
