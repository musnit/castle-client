import React from 'react';
import { Share, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserAvatar } from '../components/UserAvatar';

import Feather from 'react-native-vector-icons/Feather';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  creator: {
    position: 'absolute',
    left: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
  },
  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 12,
    ...Constants.styles.textShadow,
  },
  right: {
    position: 'absolute',
    right: 8,
    top: 16,
    flexDirection: 'row',
  },
  rightButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  rightButtonIcon: {
    ...Constants.styles.textShadow,
  },
});

const onShareDeck = async (deck) => {
  let params;
  if (Constants.iOS) {
    params = {
      // message: `Play this game on Castle`,
      url: `castle://castle.games/d/${deck.deckId}`,
    };
  } else {
    params = {
      // title: 'Play this game on castle',
      message: `castle://castle.games/d/${deck.deckId}`,
    };
  }
  try {
    Share.share(params);
    // Share.share() returns a result we could capture if desired
  } catch (_) {}
};

export const PlayDeckActions = ({ deck, disabled }) => {
  const { creator } = deck;
  const { push } = useNavigation();

  return (
    <React.Fragment>
      <TouchableOpacity
        disabled={disabled}
        style={styles.creator}
        onPress={() => push('Profile', { userId: creator.userId })}>
        <View style={styles.avatar}>
          <UserAvatar url={creator.photo?.url} />
        </View>
        <Text style={styles.username}>{creator.username}</Text>
      </TouchableOpacity>
      <View style={styles.right} pointerEvents={disabled ? 'none' : 'auto'}>
        <TouchableOpacity
          style={styles.rightButton}
          onPress={() => push('ViewSource', { deckIdToEdit: deck.deckId })}>
          <Feather name="code" color="#fff" size={24} style={styles.rightButtonIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rightButton} onPress={() => onShareDeck(deck)}>
          <Feather name="share" color="#fff" size={24} style={styles.rightButtonIcon} />
        </TouchableOpacity>
      </View>
    </React.Fragment>
  );
};
