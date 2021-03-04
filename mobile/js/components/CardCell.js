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
    borderRadius: Constants.CARD_BORDER_RADIUS,
    backgroundColor: '#000',
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
  containerFullWidth: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: Constants.CARD_BORDER_RADIUS,
  },
  container: {
    position: 'absolute',
    left: 16,
    top: 16,
    backgroundColor: '#fff',
    borderRadius: 3,
    padding: 8,
  },
  info: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#fff',
    padding: 8,
  },
  label: {
    color: '#000',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

const InitialCardIndicator = ({ isFullWidth }) => (
  <View style={isFullWidth ? initialCardStyles.containerFullWidth : initialCardStyles.container}>
    <View style={isFullWidth ? initialCardStyles.info : null}>
      <Text style={initialCardStyles.label}>Top Card</Text>
    </View>
  </View>
);

const CardArtwork = ({ card, useOverlay, isPrivate, previewVideo, previewVideoPaused }) => {
  let image = null;
  let backgroundImage;
  const [videoLoading, setVideoLoading] = React.useState(!!previewVideo?.url);
  const onVideoLoad = React.useCallback(() => requestAnimationFrame(() => setVideoLoading(false)));
  if (previewVideo?.firstFrameImage) {
    backgroundImage = previewVideo.firstFrameImage;
  } else if (card.backgroundImage) {
    backgroundImage = card.backgroundImage;
  }
  if (backgroundImage) {
    let uri;
    const { url, smallUrl, overlayUrl, privateCardUrl } = backgroundImage;
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
    // NOTE: rn-video includes a "poster" prop to show a built-in preview image,
    // but it seems to drop frames before the video actually plays.
    // instead, show our own image over the video until onLoad is called
    return (
      <View pointerEvents="none" style={styles.cardPreview}>
        <Video
          style={styles.cardPreview}
          source={{ uri: previewVideo.url }}
          repeat={true}
          muted={true}
          onLoad={onVideoLoad}
          paused={previewVideoPaused ?? false}
        />
        {videoLoading ? image : null}
      </View>
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
  previewVideo,
  previewVideoPaused,
  isFullWidth,
  style,
}) => {
  let cardStyles = styles.card;
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
            previewVideoPaused={previewVideoPaused}
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
          {isInitialCard && <InitialCardIndicator isFullWidth={isFullWidth} />}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};
