import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BottomSheet } from '../../components/BottomSheet';
import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import { useCardCreator } from '../CreateCardContext';

import * as Constants from '../../Constants';

import FastImage from 'react-native-fast-image';

const CAPTURE_FPS = 12;

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
});

const LoadingOverlay = () => (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator />
  </View>
);

const CapturePreview = ({ visible, path, numFrames }) => {
  const [loadedImageSize, setLoadedImageSize] = React.useState({ width: 0, height: 0 });
  const [loadingOverlayVisible, setLoadingOverlayVisible] = React.useState(true);

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
      frameInterval = setInterval(() => changeFrameState('increment'), 1000 / CAPTURE_FPS);
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
  React.useEffect(() => {
    if (visible) {
      setLoadingOverlayVisible(true);
      changeFrameState('reset');

      // react-native-fast-image assumes files never change on disk for the same uri.
      // when the preview sheet loads, ensure we miss cache the first time.
      // (react native's built-in Image component doesn't handle file:// uri well enough.)
      setBustCacheKey(Date.now().toString());
    }
  }, [visible]);

  React.useEffect(() => {
    // wait until boomerang loops once to hide overlay
    if (frameState.rate == -1 && frameState.index == numFrames - 1) {
      setLoadingOverlayVisible(false);
    }
  }, [frameState]);

  if (visible && path && numFrames) {
    const currentFramePath = `file://${path}${frameState.index}.png?key=${bustCacheKey}`;
    return (
      <View style={styles.previewContainer}>
        <FastImage style={styles.previewFrame} source={{ uri: currentFramePath }} onLoad={onLoad} />
        <View style={styles.info}>
          <Text>Frames sampled per second: {CAPTURE_FPS}</Text>
          <Text>Number of frames to apex: {numFrames}</Text>
          <Text>
            Frame size: {loadedImageSize.width}x{loadedImageSize.height}
          </Text>
        </View>
        {loadingOverlayVisible ? <LoadingOverlay /> : null}
      </View>
    );
  }
  return null;
};

export const CapturePreviewSheet = ({ onClose, ...props }) => {
  const { lastCaptureData } = useCardCreator();
  const { path, numFrames } = lastCaptureData;
  const { isOpen } = props;

  const renderContent = () => <CapturePreview path={path} numFrames={numFrames} visible={isOpen} />;
  const renderHeader = () => <BottomSheetHeader title="Card Preview" onClose={onClose} />;

  return (
    <BottomSheet
      renderContent={renderContent}
      renderHeader={renderHeader}
      style={styles.container}
      {...props}
    />
  );
};
