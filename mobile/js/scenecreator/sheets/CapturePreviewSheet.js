import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BottomSheet } from '../../components/BottomSheet';
import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import { useCardCreator } from '../CreateCardContext';
import { useGhostUI } from '../../ghost/GhostUI';

import * as Constants from '../../Constants';

import FastImage from 'react-native-fast-image';

const CAPTURE_FPS = 12;
const FPS_RANGE = new Array(11);
for (let ii = 1; ii < 2.1; ii += 0.1) FPS_RANGE.push(ii);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  previewContainer: {
    margin: 16,
    borderRadius: 6,
    overflow: 'hidden',
  },
  previewFrame: {
    width: '100%',
    aspectRatio: Constants.CARD_RATIO,
    borderRadius: 6,
  },
  info: {
    paddingTop: 16,
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
  fpsControl: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fpsButton: {
    padding: 6,
    backgroundColor: '#eee',
    margin: 2,
  },
});

const makeFramePath = (path, index, bustCacheKey) =>
  `file://${path}${index}.png?key=${bustCacheKey}`;

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

const CapturePreview = ({ visible, path, numFrames }) => {
  const [loadedImageSize, setLoadedImageSize] = React.useState({ width: 0, height: 0 });
  const [loadingOverlayVisible, setLoadingOverlayVisible] = React.useState(true);
  const [previewFps, setPreviewFps] = React.useState(CAPTURE_FPS);

  // manages boomerang order
  const [frameState, changeFrameState] = React.useReducer(
    (state, action) => {
      const { rate, index } = state;
      if (action === 'increment') {
        if (rate == 1) {
          if (index == numFrames) {
            return { rate: -1, index: index - 1 };
          } else {
            return { ...state, index: index + 1 };
          }
        } else {
          if (index == 1) {
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
      frameInterval = setInterval(() => changeFrameState('increment'), 1000 / previewFps);
    }
    return () => clearInterval(frameInterval);
  }, [visible, previewFps]);

  const onLoad = React.useCallback(
    (e) => {
      const { width, height } = e.nativeEvent;
      setLoadedImageSize({ width, height });
    },
    [setLoadedImageSize]
  );

  const [bustCacheKey, setBustCacheKey] = React.useState('');
  React.useEffect(() => {
    if (visible) {
      setLoadingOverlayVisible(true);
      changeFrameState('reset');

      // react-native-fast-image assumes files never change on disk for the same uri.
      // when the preview sheet loads, ensure we miss cache the first time.
      // (react native's built-in Image component doesn't handle file:// uri well enough.)
      let key = Date.now().toString();
      setBustCacheKey(key);

      (async () => {
        await preloadImages(path, numFrames, key);
        setLoadingOverlayVisible(false);
      })();
    }
  }, [visible]);

  if (visible && path && numFrames) {
    const currentFramePath = makeFramePath(path, frameState.index, bustCacheKey);
    return (
      <View style={styles.previewContainer}>
        <FastImage style={styles.previewFrame} source={{ uri: currentFramePath }} onLoad={onLoad} />
        <View style={styles.info}>
          <Text>Frames sampled per second: {CAPTURE_FPS}</Text>
          <Text>Number of frames to apex: {numFrames}</Text>
          <Text>
            Frame size: {loadedImageSize.width}x{loadedImageSize.height}
          </Text>
          <Text>Playback fps: {previewFps.toFixed(2)}</Text>
        </View>
        <View style={styles.fpsControl}>
          {FPS_RANGE.map((fps) => (
            <TouchableOpacity
              key={`fps-control-${fps}`}
              style={styles.fpsButton}
              onPress={() => setPreviewFps(CAPTURE_FPS * fps)}>
              <Text>{fps.toFixed(1)}x</Text>
            </TouchableOpacity>
          ))}
        </View>
        {loadingOverlayVisible ? <LoadingOverlay /> : null}
      </View>
    );
  }
  return null;
};

export const CapturePreviewSheet = ({ onClose, ...props }) => {
  const { lastCaptureData } = useCardCreator();
  const { sendGlobalAction } = useGhostUI();
  const { path, numFrames } = lastCaptureData;
  const { isOpen } = props;

  const clearDataAndClose = () => {
    sendGlobalAction('clearCapture'); // free capture buffer - could also do this earlier
    onClose();
  };

  const renderContent = () => <CapturePreview path={path} numFrames={numFrames} visible={isOpen} />;
  const renderHeader = () => <BottomSheetHeader title="Card Preview" onClose={clearDataAndClose} />;

  return (
    <BottomSheet
      renderContent={renderContent}
      renderHeader={renderHeader}
      style={styles.container}
      {...props}
    />
  );
};
