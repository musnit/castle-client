import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BottomSheet } from '../../components/BottomSheet';
import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import { useCardCreator } from '../CreateCardContext';
import { useGhostUI } from '../../ghost/GhostUI';
import { uploadDeckPreview, useSession } from '../../Session';

import * as Constants from '../../Constants';
import * as GhostEvents from '../../ghost/GhostEvents';

import FastImage from 'react-native-fast-image';
import Viewport from '../../common/viewport';

const CAPTURE_FPS = 12;
const PREVIEW_FPS = CAPTURE_FPS * 2;

const PREVIEW_CONTAINER_WIDTH = Viewport.vw * 100 - 32;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  previewContainer: {
    // set explicit width/height because children will be abs-position
    margin: 16,
    borderRadius: 6,
    width: PREVIEW_CONTAINER_WIDTH,
    aspectRatio: Constants.CARD_RATIO,
  },
  previewFrame: {
    // position all frames absolutely and move to show
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    aspectRatio: Constants.CARD_RATIO,
    borderRadius: 6,
  },
  hiddenFrame: {
    // offset invisible frames to prevent rerender/reload
    left: 5000,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const makeFramePath = (path, index, bustCacheKey) => {
  if (bustCacheKey) {
    return `file://${path}${index}.png?key=${bustCacheKey}`;
  } else {
    return `file://${path}${index}.png`;
  }
};

const preloadImages = (path, numFrames, bustCacheKey) => {
  let paths = [];
  for (let ii = 1; ii < numFrames + 1; ii++) {
    paths.push({ uri: makeFramePath(path, ii, bustCacheKey) });
  }
  FastImage.preload(paths);
};

const LoadingOverlay = () => (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator />
  </View>
);

const CapturePreview = ({ visible, data, onUseCapture }) => {
  const { path, numFrames } = data;
  const [loadedImageSize, setLoadedImageSize] = React.useState({ width: 0, height: 0 });
  const [loadingOverlayVisible, setLoadingOverlayVisible] = React.useState(true);

  // manages boomerang order
  const [frameState, changeFrameState] = React.useReducer(
    (state, action) => {
      const { rate, index } = state;
      if (action === 'increment') {
        if (rate === 1) {
          if (index === numFrames) {
            return { rate: -1, index: index - 1 };
          } else {
            return { ...state, index: index + 1 };
          }
        } else {
          if (index === 1) {
            return { rate: 1, index: index + 1 };
          } else {
            return { ...frameState, index: index - 1 };
          }
        }
      } else if (action === 'reset') {
        return { index: 1, rate: 1 };
      }
    },
    { index: 1, rate: 1 }
  );

  // animate between frames
  React.useEffect(() => {
    let frameInterval;
    if (visible) {
      frameInterval = setInterval(() => changeFrameState('increment'), 1000 / PREVIEW_FPS);
    }
    return () => clearInterval(frameInterval);
  }, [visible]);

  const onLoad = React.useCallback(
    (e) => {
      const { width, height } = e.nativeEvent;
      setLoadedImageSize({ width, height });
    },
    [setLoadedImageSize]
  );

  const [bustCacheKey, setBustCacheKey] = React.useState('');
  const [frames, setFrames] = React.useState([]);
  React.useEffect(() => {
    if (visible) {
      setLoadingOverlayVisible(true);
      changeFrameState('reset');

      // react-native-fast-image assumes files never change on disk for the same uri.
      // when the preview sheet loads, ensure we miss cache the first time.
      // (react native's built-in Image component doesn't handle file:// uri well enough.)
      let key = Date.now().toString();
      setBustCacheKey(key);
      let newFrames = [];
      for (let ii = 1; ii < numFrames + 1; ii++) newFrames.push(makeFramePath(path, ii, key));
      setFrames(newFrames);

      (async () => {
        await preloadImages(path, numFrames, key);
        setLoadingOverlayVisible(false);
      })();
    }
  }, [visible]);

  if (visible && path && numFrames) {
    // render all frames simultaneously, but abs-position the visible one on screen.
    // prevents white flashes from re-rendering FastImage on Android.
    return (
      <View style={styles.previewContainer}>
        {frames.map((path, ii) => (
          <FastImage
            key={`frame-${ii}`}
            style={
              ii + 1 == frameState.index
                ? styles.previewFrame
                : [styles.previewFrame, styles.hiddenFrame]
            }
            source={{ uri: path }}
            onLoad={onLoad}
          />
        ))}
        {loadingOverlayVisible ? <LoadingOverlay /> : null}
      </View>
    );
  }
  return null;
};

export const CapturePreviewSheet = ({ onClose, ...props }) => {
  const { deck } = useCardCreator();
  const { userId: signedInUserId } = useSession();
  const [lastCaptureData, setLastCaptureData] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const { sendGlobalAction } = useGhostUI();
  const { isOpen } = props;

  React.useEffect(() => {
    if (!isOpen) {
      setLastCaptureData({});
    }
  }, [isOpen]);

  GhostEvents.useListen({
    eventName: 'GHOST_CAPTURE',
    handler: async (data) => {
      setLastCaptureData(data);
      sendGlobalAction('clearCapture'); // free capture buffer
    },
  });

  const hasData = lastCaptureData?.path;

  const onUseCapture = async () => {
    const isDeckOwner = signedInUserId === deck?.creator?.userId;
    if (hasData && isDeckOwner) {
      await setLoading(true);
      const { path, numFrames } = lastCaptureData;
      let paths = [];
      for (let ii = 1; ii < numFrames + 1; ii++) {
        paths.push(makeFramePath(path, ii));
      }
      const result = await uploadDeckPreview({ deckId: deck.deckId, framePaths: paths });
      await setLoading(false);
      if (result?.url) {
        onClose();
      }
    }
  };

  const renderContent = () =>
    hasData ? (
      <CapturePreview data={lastCaptureData} visible={isOpen} onUseCapture={onUseCapture} />
    ) : (
      <LoadingOverlay />
    );
  const renderHeader = () => (
    <BottomSheetHeader
      title="Card Preview"
      onClose={onClose}
      onDone={hasData ? onUseCapture : undefined}
      doneLabel="Use"
      loading={loading}
    />
  );

  return (
    <BottomSheet
      renderContent={renderContent}
      renderHeader={renderHeader}
      style={styles.container}
      {...props}
    />
  );
};
