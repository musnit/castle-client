import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { gql } from '@apollo/client';
import { useNavigation } from '../ReactNavigation';
import { ReactionButton } from '../components/ReactionButton';
import { UserAvatar } from '../components/UserAvatar';

import * as Constants from '../Constants';
import * as Session from '../Session';

import Feather from 'react-native-vector-icons/Feather';

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
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

export const PlayDeckFooter = ({ deck }) => {
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
      return navigate('PlayDeck', {
        decks: [result.data.deck],
        initialDeckIndex: 0,
        title: 'Remixed deck',
      });
    }
  }, [deck.parentDeckId, navigate]);

  return (
    <View style={styles.container}>
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
      <ReactionButton />
    </View>
  );
};
