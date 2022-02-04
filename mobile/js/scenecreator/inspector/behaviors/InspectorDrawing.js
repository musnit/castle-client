import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  useCoreState,
  sendAsync,
  sendBehaviorAction,
  sendGlobalAction,
} from '../../../core/CoreEvents';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { InspectorSegmentedControl } from '../components/InspectorSegmentedControl';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';

import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import FastImage from 'react-native-fast-image';

import * as Constants from '../../../Constants';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  frameContainer: {
    width: 72,
    height: 72,
    padding: 4,
    borderWidth: 1,
    backgroundColor: '#fff',
    ...Constants.styles.dropShadow,
    borderRadius: 4,
    borderColor: '#000',
    marginRight: 10,
  },
  frameContainerNew: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#aaa',
    shadowOpacity: 0,
  },
  image: {
    flex: 1,
  },
  frameIndexContainer: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 27,
    height: 27,
    backgroundColor: 'white',
    borderTopLeftRadius: 3,
    borderBottomRightRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameIndexContainerSelected: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 27,
    height: 27,
    backgroundColor: 'black',
    borderTopLeftRadius: 3,
    borderBottomRightRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameEditArtContainer: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 27,
    height: 27,
    backgroundColor: 'white',
    borderTopLeftRadius: 3,
    borderBottomRightRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    paddingBottom: 16,
    fontSize: 16,
  },
});

const items = [
  {
    name: 'Still',
    value: 'still',
  },
  {
    name: 'Once',
    value: 'play once',
  },
  {
    name: 'Loop',
    value: 'loop',
  },
];

const AddFrameButton = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.frameContainer, styles.frameContainerNew]}>
      <MCIcon name="plus" size={40} color="#888" />
    </TouchableOpacity>
  );
};

const FramePreview = ({ frameOneIndex, base64Png, isInitialFrame, onPressFrame, onPressEdit }) => (
  <Pressable style={styles.frameContainer} onPress={() => onPressFrame(frameOneIndex)}>
    <View style={{ flex: 1, backgroundColor: '#0001', borderRadius: 1 }}>
      <FastImage
        style={styles.image}
        source={{
          uri: `data:image/png;base64,${base64Png}`,
        }}
      />

      {isInitialFrame ? (
        <View style={styles.frameIndexContainerSelected}>
          <Icon name="check" size={20} color="#fff" />
        </View>
      ) : (
        <View style={styles.frameIndexContainer}>
          <Text style={{ fontWeight: '500' }}>{frameOneIndex}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.frameEditArtContainer}
        onPress={() => onPressEdit(frameOneIndex)}>
        <MCIcon name="pencil-outline" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  </Pressable>
);

export default InspectorDrawing = ({ drawing2 }) => {
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Drawing2');
  const framePreviews = useCoreState('EDITOR_SELECTED_DRAWING_FRAMES');
  const sendAction = React.useCallback((...args) => sendBehaviorAction('Drawing2', ...args), []);

  const [playMode, setPlayMode] = useOptimisticBehaviorValue({
    component,
    propName: 'playMode',
    propType: 'string',
    sendAction,
  });
  const selectedItemIndex = items.findIndex((item) => playMode === item.value);
  const onChangePlayMode = React.useCallback(
    (index) => {
      if (index !== selectedItemIndex) {
        setPlayMode('set', items[index].value);
      }
    },
    [setPlayMode, selectedItemIndex]
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

  // visible is part of Body, but we put it in the Drawing UI
  const bodyComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Body');
  const sendBodyAction = React.useCallback(
    (...args) => sendBehaviorAction('Body', ...args),
    [sendBehaviorAction]
  );
  const [visible, setVisibleAction] = useOptimisticBehaviorValue({
    component: bodyComponent,
    propName: 'visible',
    propType: 'b',
    sendAction: sendBodyAction,
  });
  const onChangeVisible = React.useCallback(
    (visible) => {
      setVisibleAction('set', visible);
    },
    [setVisibleAction]
  );

  if (!component) {
    // actor doesn't have Drawing2
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Artwork</Text>

      <ScrollView horizontal style={{ flexDirection: 'row', marginBottom: 20, paddingBottom: 1 }}>
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
        <AddFrameButton onPress={openDrawToolAtNewFrame} />
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ width: '50%' }}>
          <Text style={{ fontSize: 16 }}>Animation</Text>
        </View>
        <InspectorSegmentedControl
          style={{ width: '50%' }}
          items={items}
          onChange={onChangePlayMode}
          selectedItemIndex={selectedItemIndex}
        />
      </View>

      <BehaviorPropertyInputRow
        behavior={drawing2}
        component={component}
        propName="framesPerSecond"
        label="Frames per second"
        decimalDigits={2}
        min={-30}
        max={30}
        sendAction={sendAction}
      />
      {bodyComponent ? (
        <InspectorCheckbox value={visible} onChange={onChangeVisible} label="Visible" />
      ) : null}
    </View>
  );
};
