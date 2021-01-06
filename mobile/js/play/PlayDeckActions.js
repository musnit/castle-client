import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { shareDeck } from '../common/utilities';
import { useNavigation } from '../ReactNavigation';
import { UserAvatar } from '../components/UserAvatar';

import Icon from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  creator: {
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
  left: {
    flexDirection: 'row',
  },
  right: {
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

export const PlayDeckActions = ({ deck, isPlaying, onPressBack, disabled }) => {
  const { creator } = deck;
  const { push } = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {isPlaying ? (
          <TouchableOpacity onPress={onPressBack}>
            <Icon name="arrow-back" color="#fff" size={32} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          disabled={disabled}
          style={styles.creator}
          onPress={() => push('Profile', { userId: creator.userId })}>
          <View style={styles.avatar}>
            <UserAvatar url={creator.photo?.url} />
          </View>
          <Text style={styles.username}>{creator.username}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.right} pointerEvents={disabled ? 'none' : 'auto'}>
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
