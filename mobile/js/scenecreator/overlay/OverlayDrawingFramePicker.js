import * as React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import {
  useCoreState,
  sendAsync,
  sendBehaviorAction,
  sendGlobalAction,
} from '../../core/CoreEvents';
import { useOptimisticBehaviorValue } from '../inspector/InspectorUtilities';

import FastImage from 'react-native-fast-image';
import FeatherIcon from 'react-native-vector-icons/Feather';

import * as SceneCreatorConstants from '../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: SceneCreatorConstants.OVERLAY_BORDER_RADIUS,
    marginTop: 8,
  },
  frameContainer: {
    width: 38,
    height: 38,
    padding: 6,
  },
  frameContainerInitial: {
    backgroundColor: '#000',
  },
  image: {
    flex: 1,
  },
});

const FramePreview = ({ frameOneIndex, base64Png, isInitialFrame, onPressFrame }) => {
  if (isInitialFrame) {
    return (
      <View style={[styles.frameContainer, styles.frameContainerInitial]}>
        <FastImage
          style={styles.image}
          source={{
            uri: `data:image/png;base64,${base64Png}`,
          }}
        />
      </View>
    );
  } else {
    return (
      <Pressable style={styles.frameContainer} onPress={() => onPressFrame(frameOneIndex)}>
        <FastImage
          style={styles.image}
          source={{
            uri: `data:image/png;base64,${base64Png}`,
          }}
        />
      </Pressable>
    );
  }
};

export const OverlayDrawingFramePicker = () => {
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Drawing2');
  const framePreviews = useCoreState('EDITOR_SELECTED_DRAWING_FRAMES');
  const sendAction = React.useCallback((...args) => sendBehaviorAction('Drawing2', ...args), []);

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

  if (!component) {
    // actor doesn't have Drawing2
    return null;
  }

  if (framePreviews?.base64PngFrames?.length < 2) {
    return null;
  }

  const FRAME_LIMIT = 8;
  let exceedsLimit = framePreviews?.base64PngFrames?.length > FRAME_LIMIT;

  return (
    <View style={styles.container}>
      {framePreviews?.base64PngFrames?.length
        ? framePreviews.base64PngFrames.slice(0, FRAME_LIMIT).map((base64Png, ii) => {
            let isInitialFrame = initialFrame === ii + 1;
            return (
              <FramePreview
                key={`frame-${ii}`}
                frameOneIndex={ii + 1}
                base64Png={base64Png}
                isInitialFrame={isInitialFrame}
                onPressFrame={setInitialFrame}
              />
            );
          })
        : null}
      {exceedsLimit ? (
        <Pressable style={styles.frameContainer} onPress={() => openDrawToolAtFrame(initialFrame)}>
          <FeatherIcon name="more-horizontal" size={26} color={'#000'} />
        </Pressable>
      ) : null}
    </View>
  );
};
