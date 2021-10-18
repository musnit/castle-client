import React from 'react';
import { Animated, Pressable as PressableRN, StyleSheet, Text, View } from 'react-native';
import { gql } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '../ReactNavigation';
import { ReactionButton } from '../components/ReactionButton';
import { SocialCount } from '../components/SocialCount';
import { UserAvatar } from '../components/UserAvatar';

import * as Constants from '../Constants';
const CastleIcon = Constants.CastleIcon;
import * as Session from '../Session';

import { TouchableNativeFeedback as PressableRNGH } from 'react-native-gesture-handler';

// required because android Pressable doesn't receive touches outside parent container
// waiting for merge: https://github.com/facebook/react-native/pull/29039
const Pressable = Constants.iOS ? PressableRN : PressableRNGH;

const ICON_SIZE = 30;

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 90,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    flexShrink: 1,
  },
  creator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  username: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
    ...Constants.styles.textShadow,
  },
  parentAttrib: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remixIcon: {
    marginLeft: 10,
    ...Constants.styles.textShadow,
  },
  deckAction: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    marginLeft: 20,
  },
  deckActionIcon: {
    ...Constants.styles.textShadow,
  },
});

export const PlayDeckFooter = ({ deck, isPlaying, onPressComments }) => {
  const { creator } = deck;
  const { push, navigate } = useNavigation();

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
    if (result?.data?.deck && result.data.deck.visibility === 'public') {
      return navigate(
        'DeckRemixes',
        {
          deck: result.data.deck,
        },
        {
          isFullscreen: true,
        }
      );
    }
  }, [deck.parentDeckId, navigate]);

  let playingTransition = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(playingTransition, {
      toValue: isPlaying ? 0 : 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [isPlaying]);

  const onPressRemix = () => {
    return push('DeckRemixes', {
      deck: deck,
      isFullscreen: true,
    });
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[styles.background, { opacity: playingTransition }]}
        pointerEvents="none">
        <LinearGradient
          // Background Linear Gradient
          colors={['transparent', 'rgba(0, 0, 0, 0.5)', 'rgba(0,0,0,0.9)']}
          style={[styles.background]}
        />
      </Animated.View>
      <View style={styles.left} pointerEvents="box-none">
        <Pressable
          style={styles.creator}
          onPress={() => push('Profile', { userId: creator.userId })}>
          <View style={styles.avatar}>
            <UserAvatar url={creator.photo?.url} />
          </View>
          <Text style={styles.username}>{creator.username}</Text>
        </Pressable>
        {deck.parentDeckId && deck.parentDeck && (
          <View style={styles.parentAttrib}>
            <CastleIcon name="remix" color="#fff" size={14} style={styles.remixIcon} />
            <Pressable onPress={navigateToParent}>
              <Text numberOfLines={1} style={styles.username}>
                {deck.parentDeck?.creator?.username}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
      {deck?.childDecksCount > 0 && (
        <Pressable style={styles.deckAction} onPress={onPressRemix}>
          <CastleIcon name="remix" color="#fff" size={ICON_SIZE} style={styles.deckActionIcon} />
          <SocialCount count={deck.childDecksCount} />
        </Pressable>
      )}
      <Pressable style={styles.deckAction} onPress={onPressComments}>
        <CastleIcon name="comment" color="#fff" size={ICON_SIZE} style={styles.deckActionIcon} />
        <SocialCount count={deck.comments?.count} />
      </Pressable>
      <View style={styles.deckAction}>
        <ReactionButton deck={deck} iconSize={ICON_SIZE} />
      </View>
    </View>
  );
};
