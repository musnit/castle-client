import * as React from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { formatCount } from '../common/utilities';
import { gql } from '@apollo/client';
import { useNavigation } from '../ReactNavigation';
import { UserAvatar } from '../components/UserAvatar';

import * as Constants from '../Constants';
import * as Session from '../Session';
import * as SceneCreatorConstants from '../scenecreator/SceneCreatorConstants';

import Icon from 'react-native-vector-icons/MaterialIcons';

const CastleIcon = Constants.CastleIcon;
const ICON_SIZE = 34;

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingTop: 16,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    flexShrink: 1,
    paddingLeft: 16,
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
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
  parentAttrib: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 3,
    padding: 4,
    marginTop: 8,
    alignItems: 'center',
  },
  parentUsername: {
    paddingLeft: 4,
    color: '#888',
    fontSize: 16,
  },
  commentsHeading: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 8,
    paddingTop: 16,
  },
  commentsLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  childAttrib: {
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  childLabel: {
    fontSize: 16,
    textTransform: 'uppercase',
    color: '#888',
    paddingRight: 4,
  },
  back: {
    flexShrink: 0,
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 16,
  },
});

export const CommentsSheetHeader = ({ deck = {}, onClose }) => {
  const { push, navigate } = useNavigation();

  const onPressRemix = React.useCallback(() => {
    return push('DeckRemixes', {
      deck,
      isFullscreen: true,
    });
  }, [deck]);

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
  }, [deck?.parentDeckId, navigate]);

  if (!deck?.creator) {
    return null;
  }
  const { creator } = deck;

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={styles.headerLeft} pointerEvents="box-none">
          <Pressable
            style={styles.creator}
            onPress={() => push('Profile', { userId: creator.userId })}>
            <View style={styles.avatar}>
              <UserAvatar url={creator.photo?.url} />
            </View>
            <Text style={styles.username}>{creator.username}</Text>
          </Pressable>
        </View>
        <TouchableOpacity style={styles.back} onPress={onClose}>
          <CastleIcon name="close" size={22} color="#000" />
        </TouchableOpacity>
      </View>
      {deck.parentDeckId && deck.parentDeck ? (
        <View style={[styles.row, { paddingHorizontal: 16 }]}>
          <View style={styles.parentAttrib}>
            <CastleIcon name="remix" color="#888" size={12} style={styles.remixIcon} />
            <Pressable onPress={navigateToParent}>
              <Text numberOfLines={1} style={styles.parentUsername}>
                Remixed {deck.parentDeck?.creator?.username}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <View style={[styles.row, { paddingHorizontal: 16 }]}>
        <View style={styles.commentsHeading}>
          <Text style={styles.commentsLabel}>{formatCount(deck.comments.count)} comments</Text>
        </View>
        {deck.childDecksCount > 0 ? (
          <Pressable style={styles.childAttrib} onPress={onPressRemix}>
            <Text style={styles.childLabel}>View {formatCount(deck.childDecksCount)} remixes</Text>
            <Icon name="arrow-forward" color="#888" size={16} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};
