import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import FastImage from 'react-native-fast-image';

import * as Constants from './Constants';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    borderRadius: 6,
    backgroundColor: '#8CA5CD',
    width: '100%',
    aspectRatio: Constants.CARD_RATIO,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardPreviewImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardTitle: {
    ...Constants.styles.plainButton,
    ...Constants.styles.plainButtonLabel,
    ...Constants.styles.dropShadow,
  },
});

const initialCardStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 6,
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

const privateStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlayImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'repeat',
  },
});

const InitialCardIndicator = () => (
  <View style={initialCardStyles.container}>
    <View style={initialCardStyles.info}>
      <Text style={initialCardStyles.label}>Top Card</Text>
    </View>
  </View>
);

// not using FastImage because resizeMode: 'repeat' doesn't work properly
const PrivateIndicator = () => (
  <View style={privateStyles.container}>
    <Image
      style={privateStyles.overlayImage}
      source={require('../assets/images/facedown-overlay-tile.png')}
    />
  </View>
);

const CardCell = ({ card, onPress, title, isInitialCard, isPrivate }) => {
  let cardStyles = styles.card;
  if (card.backgroundImage && card.backgroundImage.primaryColor) {
    cardStyles = [styles.card, { backgroundColor: card.backgroundImage.primaryColor }];
  }
  let uri;
  if (card.backgroundImage) {
    const { url, smallUrl } = card.backgroundImage;
    uri = smallUrl ? smallUrl : url;
  }
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={cardStyles}
        activeOpacity={0.8}
        disabled={!onPress}
        onPress={onPress}>
        {card.backgroundImage && <FastImage style={styles.cardPreviewImage} source={{ uri }} />}
        {title && (
          <View style={styles.cardTitle}>
            <Text>{title}</Text>
          </View>
        )}
        {isInitialCard && <InitialCardIndicator />}
        {isPrivate && <PrivateIndicator />}
      </TouchableOpacity>
    </View>
  );
};

export default CardCell;
