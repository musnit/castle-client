import React from 'react';
import { Animated, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { shareDeck } from '../common/utilities';
import { useNavigation } from '../ReactNavigation';
import { UserAvatar } from '../components/UserAvatar';

import Icon from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import gql from 'graphql-tag';

import * as Constants from '../Constants';
import * as Session from '../Session';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: '100%',
    borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
  },
  back: {
    marginRight: 16,
  },
  creator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
  },
  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
    ...Constants.styles.textShadow,
  },
  row: {
    flexDirection: 'row',
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
  remixIcon: {
    marginLeft: 8,
    ...Constants.styles.textShadow,
  },
});

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const PlayDeckActions = ({ deck, isPlaying, onPressBack, disabled, backgroundColor }) => {
  const { creator } = deck;
  const { push } = useNavigation();

  const { navigate } = useNavigation();
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
    if (result?.data?.deck) {
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
    outputRange: [-(8 + 32), 0],
  });

  React.useEffect(() => {
    Animated.spring(creatorTransform, {
      toValue: isPlaying ? 1 : 0,
      friction: 20,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [isPlaying]);

  return (
    <View style={{ ...styles.container, backgroundColor: backgroundColor }}>
      <Animated.View style={{ ...styles.row, transform: [{ translateX: creatorTransformX }] }}>
        <AnimatedTouchableOpacity
          style={[styles.back, { opacity: creatorTransform }]}
          onPress={onPressBack}>
          <Icon name="arrow-back" color="#fff" size={32} />
        </AnimatedTouchableOpacity>
        <TouchableOpacity
          disabled={disabled}
          style={styles.creator}
          onPress={() => push('Profile', { userId: creator.userId })}>
          <View style={styles.avatar}>
            <UserAvatar url={creator.photo?.url} />
          </View>
          <Text style={styles.username}>{creator.username}</Text>
        </TouchableOpacity>
        {deck.parentDeckId && deck.parentDeck && (
          <View style={styles.creator}>
            <Feather name="refresh-cw" color="#fff" size={14} style={styles.remixIcon} />
            <TouchableOpacity disabled={disabled} onPress={navigateToParent}>
              <Text style={styles.username}>{deck.parentDeck?.creator?.username}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
      <View style={styles.row} pointerEvents={disabled ? 'none' : 'auto'}>
        <TouchableOpacity
          style={styles.rightButton}
          onPress={() => push('ViewSource', { deckIdToEdit: deck.deckId })}>
          <Feather name="code" color="#fff" size={24} style={styles.rightButtonIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rightButton} onPress={() => shareDeck(deck)}>
          <Feather name="share" color="#fff" size={24} style={styles.rightButtonIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
