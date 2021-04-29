import React from 'react';
import { Animated, Pressable as PressableRN, StyleSheet, Text, View } from 'react-native';
import { gql } from '@apollo/client';
import { useNavigation } from '../ReactNavigation';
import { ReactionButton } from '../components/ReactionButton';
import { UserAvatar } from '../components/UserAvatar';
import { LinearGradient } from 'expo-linear-gradient';

import * as Constants from '../Constants';
import * as Session from '../Session';

import Feather from 'react-native-vector-icons/Feather';
import { TouchableNativeFeedback as PressableRNGH } from 'react-native-gesture-handler';

// required because android Pressable doesn't receive touches outside parent container
// waiting for merge: https://github.com/facebook/react-native/pull/29039
const Pressable = Constants.iOS ? PressableRN : PressableRNGH;

const AVATAR_SIZE = 32;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 80,
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
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
    ...Constants.styles.textShadow,
  },
  parentAttrib: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remixIcon: {
    marginLeft: 8,
    ...Constants.styles.textShadow,
  },
});

export const PlayDeckFooter = ({ deck, isPlaying }) => {
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
      return navigate('DeckRemixes', {
        deck: result.data.deck,
      });
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

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.background, { opacity: playingTransition }]}>
        <LinearGradient
          // Background Linear Gradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={[styles.background]}
        />
      </Animated.View>
      <View style={styles.left}>
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
            <Feather name="refresh-cw" color="#fff" size={14} style={styles.remixIcon} />
            <Pressable onPress={navigateToParent}>
              <Text numberOfLines={1} style={styles.username}>
                {deck.parentDeck?.creator?.username}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
      <ReactionButton deck={deck} />
    </View>
  );
};
