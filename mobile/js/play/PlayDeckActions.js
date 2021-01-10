import React from 'react';
import { Animated, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
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
    alignItems: 'center',
    paddingHorizontal: 8,
    height: '100%',
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

export const PlayDeckActions = ({ deck, isPlaying, onPressBack, disabled }) => {
  const { creator } = deck;
  const { push } = useNavigation();

  const { navigate } = useNavigation();
  const navigateToParent = React.useCallback(
    () =>
      navigate('Browse', {
        screen: 'ViewSource',
        params: {
          deckIdToEdit: deck.parentDeckId,
        },
      }),
    [deck.parentDeckId, navigate]
  );

  let creatorTransform = React.useRef(new Animated.Value(0)).current;
  creatorTransformX = creatorTransform.interpolate({
    inputRange: [0, 1],
    outputRange: [-(8 + 32), 0],
  });

  React.useEffect(() => {
    // Animated.timing(creatorTransform, { toValue: isPlaying ? 1 : 0, duration: 200, useNativeDriver: true }).start();
    Animated.spring(creatorTransform, {
      toValue: isPlaying ? 1 : 0,
      friction: 20,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [isPlaying]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ ...styles.row, transform: [{ translateX: creatorTransformX }] }}>
        <TouchableOpacity style={styles.back} onPress={onPressBack}>
          <Icon name="arrow-back" color="#fff" size={32} />
        </TouchableOpacity>
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
