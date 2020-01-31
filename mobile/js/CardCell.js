import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#f2f2f2',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPreviewImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 6,
  },
  cardTitle: {
    backgroundColor: '#f2f2f2',
    padding: 4,
  },
});

const CardCell = ({ card, onPress, title }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    {card.backgroundImage && (
      <FastImage style={styles.cardPreviewImage} source={{ uri: card.backgroundImage.url }} />
    )}
    <Text style={styles.cardTitle}>{title ? title : card.title}</Text>
  </TouchableOpacity>
);

export default CardCell;
