import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
});

export const DeckFeedItemHeader = ({ isPlaying, onPressBack }) => (
  <View style={styles.container}>
    {isPlaying ? (
      <TouchableOpacity onPress={onPressBack}>
        <Icon name="arrow-back" color="#fff" size={32} />
      </TouchableOpacity>
    ) : null}
  </View>
);
