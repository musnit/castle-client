import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import FastImage from 'react-native-fast-image';

import * as Constants from './Constants';

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    backgroundColor: '#8CA5CD',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 1,
  },
  cardPreviewImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardTitle: {
    ...Constants.styles.overlayButton,
    ...Constants.styles.overlayButtonLabel,
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
