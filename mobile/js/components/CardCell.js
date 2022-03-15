import React from 'react';
import { Image, StyleSheet, Pressable, View } from 'react-native';
import { AppText as Text } from './AppText';
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
    top: 4,
    left: 4,
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const initialCardStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#000',
    borderRadius: 4,
    ...Constants.styles.dropShadow,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

const InitialCardIndicator = ({ inGrid }) => (
  <View
    style={[
      initialCardStyles.container,
      {
        bottom: inGrid ? 4 : 12,
        left: inGrid ? 4 : 12,
        paddingVertical: inGrid ? 4 : 6,
        paddingHorizontal: inGrid ? 6 : 8,
      },
    ]}>
    <Text style={[initialCardStyles.label, { fontSize: inGrid ? 12 : 15 }]}>Top Card</Text>
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
          mixWithOthers="mix"
          ignoreSilentSwitch="obey"
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
  showVisibility,
  previewVideo,
  previewVideoPaused,
  inGrid,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Pressable
        disabled={!onPress}
        onPress={onPress}
        style={{
          ...styles.card,
          borderRadius: inGrid ? Constants.CARD_SMALL_BORDER_RADIUS : Constants.CARD_BORDER_RADIUS,
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
        {showVisibility ? (
          <View style={styles.visibility}>
            <Icon
              size={16}
              name={
                visibility === 'private' ? 'lock' : visibility === 'unlisted' ? 'link' : 'public'
              }
              color="#fff"
            />
          </View>
        ) : null}
        {isInitialCard && <InitialCardIndicator inGrid={inGrid} />}
      </Pressable>
    </View>
  );
};
