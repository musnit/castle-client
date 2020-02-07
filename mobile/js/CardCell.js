import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

const initialCardStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'flex-end',
  },
  info: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 8,
    width: '100%',
  },
  label: {
    color: '#000',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

const InitialCardIndicator = () => (
  <View style={initialCardStyles.container}>
    <View style={initialCardStyles.info}>
      <Text style={initialCardStyles.label}>Top Card</Text>
    </View>
  </View>
);

const CardCell = ({ card, onPress, title, isInitialCard }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    {card.backgroundImage && (
      <FastImage style={styles.cardPreviewImage} source={{ uri: card.backgroundImage.url }} />
    )}
    <Text style={styles.cardTitle}>{title ? title : card.title}</Text>
    {isInitialCard && <InitialCardIndicator />}
  </TouchableOpacity>
);

export default CardCell;
