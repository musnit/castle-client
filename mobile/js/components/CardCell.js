import React from 'react';
import { Image, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';
import { UserAvatar } from '../components/UserAvatar';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    borderRadius: Constants.CARD_SMALL_BORDER_RADIUS,
    backgroundColor: '#8CA5CD',
    width: '100%',
    aspectRatio: Constants.CARD_RATIO,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  cardPreviewImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  metaImage: {
    width: 18,
    marginRight: 6,
    ...Constants.styles.dropShadow,
  },
  metaTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    ...Constants.styles.textShadow,
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

const InitialCardIndicator = () => (
  <View style={initialCardStyles.container}>
    <View style={initialCardStyles.info}>
      <Text style={initialCardStyles.label}>Top Card</Text>
    </View>
  </View>
);

export const CardCell = ({
  card,
  onPress,
  title,
  imageUrl,
  useOverlay,
  isInitialCard,
  isPrivate,
  isFullSize,
}) => {
  let cardStyles = styles.card;
  if (card.backgroundImage && card.backgroundImage.primaryColor) {
    cardStyles = [styles.card, { backgroundColor: card.backgroundImage.primaryColor }];
  }
  if (isFullSize) {
    cardStyles += { borderRadius: Constants.CARD_BORDER_RADIUS };
  }
  let uri;
  if (card.backgroundImage) {
    const { url, smallUrl, overlayUrl, privateCardUrl } = card.backgroundImage;
    if (useOverlay && overlayUrl) {
      uri = overlayUrl;
    } else if (isPrivate && privateCardUrl) {
      uri = privateCardUrl;
    } else if (smallUrl) {
      uri = smallUrl;
    } else {
      uri = url;
    }
  }
  return (
    <View
      style={styles.container}
      renderToHardwareTextureAndroid={useOverlay}
      shouldRasterizeIOS={useOverlay}>
      <TouchableWithoutFeedback disabled={!onPress} onPress={onPress}>
        <View style={cardStyles}>
          {card.backgroundImage && <FastImage style={styles.cardPreviewImage} source={{ uri }} />}
          {imageUrl || title ? (
            <View style={styles.meta}>
              {imageUrl && (
                <View style={styles.metaImage}>
                  <UserAvatar url={imageUrl} />
                </View>
              )}
              {title && <Text style={styles.metaTitle}>{title}</Text>}
            </View>
          ) : null}
          {isInitialCard && <InitialCardIndicator />}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};
