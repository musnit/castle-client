import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCardCreator } from '../../CreateCardContext';
import {
  useCoreState,
  sendAsync,
  sendBehaviorAction,
  sendGlobalAction,
} from '../../../core/CoreEvents';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';

import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import FastImage from 'react-native-fast-image';

import * as Constants from '../../../Constants';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    flex: 1,
  },
  frameContainer: {
    width: 72,
    height: 72,
    padding: 4,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderRadius: 4,
    borderColor: '#000',
    marginRight: 10,
  },
  frameContainerNew: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#aaa',
    borderBottomWidth: 1,
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
    fontWeight: 'bold',
    paddingBottom: 16,
    fontSize: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 4,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    borderBottomWidth: 2,
    marginBottom: 20,
  },
  segmentedControlLabels: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  segmentedControlItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderColor: Constants.colors.black,
    fontSize: 16,
  },
  segmentedControlItemSelected: {
    backgroundColor: Constants.colors.black,
  },
  segmentedControlLabelSelected: {
    color: Constants.colors.white,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
  },
});

const EditArtButton = ({ onPress }) => {
  const {
    inspectorActions: data,
    sendInspectorAction: sendAction,
    applicableTools,
    behaviorActions,
  } = useCardCreator();

  return (
    <TouchableOpacity onPress={onPress} style={[styles.frameContainer, styles.frameContainerNew]}>
      <Text style={{ fontSize: 48, color: '#888' }}>+</Text>
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
  const sendAction = React.useCallback((...args) => sendBehaviorAction('Drawing2', ...args), [
    sendBehaviorAction,
  ]);

  /*return (
    <BehaviorPropertyInputRow
      behavior={drawing2}
      component={component}
      propName="framesPerSecond"
      label="Frames per second"
      decimalDigits={0}
      sendAction={sendAction}
    />
  );*/

  const [playMode, playModeSetValueAndSendAction] = useOptimisticBehaviorValue({
    component,
    propName: 'playMode',
    propType: 'string',
    sendAction,
  });

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

  const items = [
    {
      name: 'Still',
      onSelect: () => {
        playModeSetValueAndSendAction('set:playMode', 'still');
      },
    },
    {
      name: 'Play Once',
      onSelect: () => {
        playModeSetValueAndSendAction('set:playMode', 'play once');
      },
    },
    {
      name: 'Loop',
      onSelect: () => {
        playModeSetValueAndSendAction('set:playMode', 'loop');
      },
    },
  ];

  let selectedItemIndex = 0;
  if (playMode == 'play once') {
    selectedItemIndex = 1;
  } else if (playMode == 'loop') {
    selectedItemIndex = 2;
  }

  const onChange = (index) => {
    if (index !== selectedItemIndex) {
      items[index].onSelect();
    }
  };

  // TODO: actions to set initial frame, open at frame, add frame
  const openDrawTool = React.useCallback(() => {
    sendGlobalAction('setMode', 'draw');
  }, [sendGlobalAction]);

  const openDrawToolAtFrame = React.useCallback(
    (frameOneIndex) => {
      sendAsync('DRAW_TOOL_LAYER_ACTION', {
        action: 'selectFrame',
        frameIndex: frameOneIndex,
      });
      openDrawTool();
    },
    [openDrawTool]
  );

  if (!component) {
    // actor doesn't have Drawing2
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Artwork</Text>

      <ScrollView horizontal style={{ flexDirection: 'row', marginBottom: 20 }}>
        {framePreviews?.base64PngFrames?.length
          ? framePreviews.base64PngFrames.map((base64Png, ii) => {
              let isInitialFrame = initialFrame == ii + 1;
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
        <EditArtButton onPress={openDrawTool} />
      </ScrollView>

      <View style={styles.segmentedControl}>
        {items.map((item, ii) => (
          <TouchableOpacity
            key={`item-${ii}`}
            onPress={() => onChange(ii)}
            style={[
              styles.segmentedControlItem,
              ii === selectedItemIndex ? styles.segmentedControlItemSelected : null,
              { width: `${(1 / items.length) * 100}%` },
              ii > 0 ? { borderLeftWidth: 1 } : null,
            ]}>
            <Text
              style={[
                styles.segmentedControlItem,
                ii === selectedItemIndex ? styles.segmentedControlLabelSelected : null,
              ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <BehaviorPropertyInputRow
        behavior={drawing2}
        component={component}
        propName="framesPerSecond"
        label="Frames per second"
        decimalDigits={0}
        sendAction={sendAction}
      />
    </View>
  );
};
