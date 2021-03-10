import React from 'react';
import { Image, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { UserAvatar } from '../components/UserAvatar';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
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
  visibility: {
    ...Constants.styles.dropShadow,
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCount: {
    ...Constants.styles.dropShadow,
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 15,
    paddingVertical: 4,
    paddingLeft: 3,
    paddingRight: 6,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCountLabel: {
    color: '#000',
    fontWeight: 'bold',
  },
});

const initialCardStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    top: 16,
    backgroundColor: '#fff',
    borderRadius: 3,
    padding: 8,
  },
  label: {
    color: '#000',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

const InitialCardIndicator = ({ inGrid }) => (
  <View style={{ ...initialCardStyles.container, top: inGrid ? 8 : 16, left: inGrid ? 8 : 16 }}>
    <Text style={initialCardStyles.label}>Top Card</Text>
  </View>
);

const CardArtwork = ({ card, previewVideo, previewVideoPaused }) => {
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
    const { url, smallUrl } = backgroundImage;
    if (smallUrl) {
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
  creator,
  isInitialCard,
  visibility,
  playCount,
  previewVideo,
  previewVideoPaused,
  inGrid,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <TouchableWithoutFeedback disabled={!onPress} onPress={onPress}>
        <View
          style={{
            ...styles.card,
            borderRadius: inGrid
              ? Constants.CARD_SMALL_BORDER_RADIUS
              : Constants.CARD_BORDER_RADIUS,
          }}>
          <CardArtwork
            card={card}
            previewVideo={previewVideo}
            previewVideoPaused={previewVideoPaused}
          />
          {creator?.photo?.url || title ? (
            <View style={styles.meta}>
              {creator?.photo?.url && (
                <View style={styles.metaImage}>
                  <UserAvatar url={creator.photo.url} shadow={true} />
                </View>
              )}
              {title && <Text style={styles.metaTitle}>{title}</Text>}
            </View>
          ) : null}
          {visibility && visibility !== 'public' ? (
            <View style={styles.visibility}>
              <Icon
                size={18}
                name={
                  visibility === 'private' ? 'lock' : visibility === 'unlisted' ? 'link' : 'share'
                }
                color="#000"
              />
            </View>
          ) : null}
          {visibility === 'public' && playCount ? (
            <View style={styles.playCount}>
              <Icon size={16} name="play-arrow" color="#000" />
              <Text style={styles.playCountLabel}>{playCount}</Text>
            </View>
          ) : null}
          {isInitialCard && <InitialCardIndicator inGrid={inGrid} />}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};
