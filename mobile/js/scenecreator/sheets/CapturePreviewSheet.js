import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
});

const CapturePreview = ({ visible, path, numFrames }) => {
  const [loadedImageSize, setLoadedImageSize] = React.useState({ width: 0, height: 0 });
  const [frameState, incrementFrameState] = React.useReducer(
    (state, action) => {
      const { rate, index } = state;
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
    },
    { index: 1, rate: 1 }
  );

  React.useEffect(() => {
    let frameInterval;
    if (visible) {
      frameInterval = setInterval(incrementFrameState, 1000 / CAPTURE_FPS);
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

  if (visible && path && numFrames) {
    const currentFramePath = `file://${path}${frameState.index}.png`;
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
