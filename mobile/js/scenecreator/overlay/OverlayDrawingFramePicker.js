import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  useCoreState,
  sendAsync,
  sendBehaviorAction,
  sendGlobalAction,
} from '../../core/CoreEvents';
import { useOptimisticBehaviorValue } from '../inspector/InspectorUtilities';

import FastImage from 'react-native-fast-image';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Viewport from '../../common/viewport';

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  scrollView: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  frames: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 6,
    marginRight: 12,
  },
  frameContainer: {
    width: 48,
    height: 48,
    padding: 6,
  },
  frameContainerInitial: {
    backgroundColor: '#000',
  },
  frameContainerNew: {
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  image: {
    flex: 1,
  },
});

const AddFrameButton = ({ onPress }) => {
  return (
    <Pressable onPress={onPress} style={[styles.frameContainer, styles.frameContainerNew]}>
      <MCIcon name="plus" size={40} color="#000" />
    </Pressable>
  );
};

const FramePreview = ({ frameOneIndex, base64Png, isInitialFrame, onPressFrame, onPressEdit }) => (
  <Pressable
    style={[styles.frameContainer, isInitialFrame ? styles.frameContainerInitial : null]}
    onPress={() => onPressFrame(frameOneIndex)}>
    <FastImage
      style={styles.image}
      source={{
        uri: `data:image/png;base64,${base64Png}`,
      }}
    />
  </Pressable>
);

export const OverlayDrawingFramePicker = () => {
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Drawing2');
  const framePreviews = useCoreState('EDITOR_SELECTED_DRAWING_FRAMES');
  const sendAction = React.useCallback((...args) => sendBehaviorAction('Drawing2', ...args), []);

  // the list of frames might scroll horizontally if it's wider than the screen,
  // but by default it doesn't
  const [scrollEnabled, setScrollEnabled] = React.useState(false);
  const onScrollViewContentSizeChange = React.useCallback(
    (contentWidth, contentHeight) => {
      setScrollEnabled(contentWidth > Viewport.vw * 90);
    },
    [setScrollEnabled]
  );

  const [initialFrame, setInitialFrameAction] = useOptimisticBehaviorValue({
    component,
    propName: 'initialFrame',
    propType: 'i',
    sendAction,
  });
  const setInitialFrame = React.useCallback(
    (frameIndex) => setInitialFrameAction('set', frameIndex),
    [setInitialFrameAction]
  );

  const openDrawTool = React.useCallback(() => {
    sendGlobalAction('setMode', 'draw');
  }, []);

  const openDrawToolAtFrame = React.useCallback(
    (frameOneIndex) => {
      openDrawTool();
      requestAnimationFrame(() =>
        sendAsync('DRAW_TOOL_LAYER_ACTION', {
          action: 'selectFrame',
          frameIndex: frameOneIndex,
        })
      );
    },
    [openDrawTool]
  );

  const openDrawToolAtNewFrame = React.useCallback(() => {
    openDrawTool();
    requestAnimationFrame(() =>
      sendAsync('DRAW_TOOL_LAYER_ACTION', {
        action: 'addFrame',
        frameIndex: 0, // adds new frame at the end
      })
    );
  }, [openDrawTool]);

  if (!component) {
    // actor doesn't have Drawing2
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <ScrollView
        horizontal
        style={styles.scrollView}
        scrollEnabled={scrollEnabled}
        onContentSizeChange={onScrollViewContentSizeChange}>
        <View style={styles.frames}>
          {framePreviews?.base64PngFrames?.length
            ? framePreviews.base64PngFrames.map((base64Png, ii) => {
                let isInitialFrame = initialFrame === ii + 1;
                const onPressFrame = isInitialFrame ? openDrawToolAtFrame : setInitialFrame;
                return (
                  <FramePreview
                    key={`frame-${ii}`}
                    frameOneIndex={ii + 1}
                    base64Png={base64Png}
                    isInitialFrame={isInitialFrame}
                    onPressFrame={onPressFrame}
                    onPressEdit={openDrawToolAtFrame}
                  />
                );
              })
            : null}
        </View>
        <AddFrameButton onPress={openDrawToolAtNewFrame} />
      </ScrollView>
    </View>
  );
};
