import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BottomSheet } from '../../components/BottomSheet';
import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import { useCardCreator } from '../CreateCardContext';

import * as Constants from '../../Constants';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  previewContainer: {
    margin: 16,
    borderRadius: 6,
    overflow: 'hidden',
  },
  previewFrame: {
    width: '100%',
    aspectRatio: Constants.CARD_RATIO,
  },
});

const CapturePreview = ({ visible, path, numFrames }) => {
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
      frameInterval = setInterval(incrementFrameState, 1000 / 8);
    }
    return () => clearInterval(frameInterval);
  }, [visible]);
  if (visible && path && numFrames) {
    const currentFramePath = `file://${path}${frameState.index}.png`;
    return (
      <View style={styles.previewContainer}>
        <FastImage style={styles.previewFrame} source={{ uri: currentFramePath }} />
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
