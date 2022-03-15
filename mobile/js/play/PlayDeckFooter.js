import React from 'react';
import { Animated, Pressable as PressableRN, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { gql } from '@apollo/client';
import { useNavigation } from '../ReactNavigation';
import { ReactionButton } from '../components/ReactionButton';
import { SocialCount } from '../components/SocialCount';
import { UserAvatar } from '../components/UserAvatar';
import { TouchableNativeFeedback as PressableRNGH } from 'react-native-gesture-handler';

import LinearGradient from 'react-native-linear-gradient';
import tinycolor from 'tinycolor2';

import * as Constants from '../Constants';
import * as Session from '../Session';

const CastleIcon = Constants.CastleIcon;

// required because android Pressable doesn't receive touches outside parent container
// waiting for merge: https://github.com/facebook/react-native/pull/29039
const Pressable = Constants.iOS ? PressableRN : PressableRNGH;

const ICON_SIZE = 34;

const styles = StyleSheet.create({
  container: {
    height: 110,
    paddingTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderBottomRightRadius: Constants.CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -20,
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

  let endColor = deck.initialCard.backgroundColor ?? '#3b1725';
  if (tinycolor(endColor).getBrightness() > 180) {
    if (endColor == '#babef6') {
      endColor = tinycolor(endColor).darken(20).desaturate(30).toHexString();
    } else {
      endColor = tinycolor(endColor).darken(30).desaturate(30).toHexString();
    }
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[styles.background, { opacity: playingTransition }]}
        pointerEvents="none">
        <LinearGradient
          // Background Linear Gradient
          colors={[`${endColor}00`, `${endColor}bb`, endColor]}
          locations={[0, 0.2, 0.5]}
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
