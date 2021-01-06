import React from 'react';
import { Image, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';

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
  cardPreview: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardPreviewImage: {
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

const CardArtwork = ({ card, useOverlay, isPrivate, previewVideo }) => {
  let image = null;
  if (card.backgroundImage) {
    let uri;
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
    image = <FastImage style={[styles.cardPreview, styles.cardPreviewImage]} source={{ uri }} />;
  }
  if (previewVideo?.url) {
    // show the image behind the video because the video drops frames when first loading
    return (
      <>
        {image}
        <Video style={styles.cardPreview} source={{ uri: previewVideo.url }} repeat={true} />
      </>
    );
  } else if (image) {
    return image;
  }
  return null;
};

export const CardCell = ({
  card,
  onPress,
  title,
  imageUrl,
  useOverlay,
  isInitialCard,
  isPrivate,
  isFullSize,
  previewVideo,
  style,
}) => {
  let cardStyles = styles.card;
  if (card.backgroundImage && card.backgroundImage.primaryColor) {
    cardStyles = [styles.card, { backgroundColor: card.backgroundImage.primaryColor }];
  }
  if (isFullSize) {
    cardStyles += { borderRadius: Constants.CARD_BORDER_RADIUS };
  }

  return (
    <View
      style={[styles.container, style]}
      renderToHardwareTextureAndroid={useOverlay}
      shouldRasterizeIOS={useOverlay}>
      <TouchableWithoutFeedback disabled={!onPress} onPress={onPress}>
        <View style={cardStyles}>
          <CardArtwork
            card={card}
            previewVideo={previewVideo}
            useOverlay={useOverlay}
            isPrivate={isPrivate}
          />
          {imageUrl || title ? (
            <View style={styles.meta}>
              {imageUrl && (
                <View style={styles.metaImage}>
                  <UserAvatar url={imageUrl} shadow={true} />
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
