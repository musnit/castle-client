import * as React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useCardCreator } from '../../CreateCardContext';
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
    width: 64,
    height: 64,
    backgroundColor: '#0001',
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ccc',
    marginRight: 10,
  },
  image: {
    flex: 1,
  },
  frameIndexContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    backgroundColor: 'white',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameIndexContainerSelected: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    backgroundColor: 'black',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameEditArtContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    backgroundColor: 'white',
    borderRadius: 5,
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

const EditArtButton = () => {
  const { showActionSheetWithOptions } = useActionSheet();
  const {
    inspectorActions: data,
    sendInspectorAction: sendAction,
    applicableTools,
    behaviorActions,
  } = useCardCreator();

  const draw1Behavior = applicableTools.find((behavior) => behavior.name === 'Draw');
  const draw2Behavior = applicableTools.find((behavior) => behavior.name === 'Draw2');

  let onPress;

  if (draw1Behavior) {
    // TODO: eventually we can remove this legacy draw1 migration case
    onPress = () =>
      showActionSheetWithOptions(
        {
          title: 'Migrate to new draw tool?',
          message:
            'This action will discard the legacy drawing for this actor and enable the newer drawing tool.',
          options: ['Continue', 'Cancel'],
          cancelButtonIndex: 1,
        },
        async (buttonIndex) => {
          if (buttonIndex == 0) {
            if (draw2Behavior) {
              // actor already has draw2, just remove draw1
              behaviorActions.Drawing('remove');
            } else {
              // swap draw1 for draw2
              behaviorActions.Drawing('swap', { name: 'Drawing2' });
            }
          }
        }
      );
  } else if (draw2Behavior) {
    onPress = () =>
      sendAction('setActiveToolWithOptions', { id: draw2Behavior.behaviorId, addNewFrame: true });
  } else {
    console.warn(`Tried to render InspectorDrawing for an actor that has no drawing`);
    onPress = () => {};
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.frameContainer, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontSize: 30 }}>+</Text>
    </TouchableOpacity>
  );
};

export default InspectorDrawing = ({ drawing2, sendAction }) => {
  const { sendInspectorAction, applicableTools } = useCardCreator();
  const draw2Behavior = applicableTools.find((behavior) => behavior.name === 'Draw2');

  const [playMode, playModeSetValueAndSendAction] = useOptimisticBehaviorValue({
    behavior: drawing2,
    propName: 'playMode',
    sendAction,
  });

  const [initialFrame, initialFrameSetValueAndSendAction] = useOptimisticBehaviorValue({
    behavior: drawing2,
    propName: 'initialFrame',
    sendAction,
  });

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

  let frames = [];

  if (drawing2?.properties?.base64PngFrames) {
    for (let i = 0; i < drawing2.properties.base64PngFrames.numFrames; i++) {
      let isInitialFrame = initialFrame == i + 1;

      frames.push(
        <TouchableOpacity
          key={i}
          style={styles.frameContainer}
          onPress={() => {
            if (isInitialFrame) {
              sendInspectorAction('setActiveToolWithOptions', {
                id: draw2Behavior.behaviorId,
                selectedFrame: i + 1,
              });
            } else {
              initialFrameSetValueAndSendAction('set:initialFrame', i + 1);
            }
          }}>
          <FastImage
            style={styles.image}
            source={{
              uri: `data:image/png;base64,${drawing2.properties.base64PngFrames['frame' + i]}`,
            }}
          />

          {isInitialFrame ? (
            <View style={styles.frameIndexContainerSelected}>
              <Icon name="check" size={20} color="#fff" />
            </View>
          ) : (
            <View style={styles.frameIndexContainer}>
              <Text style={{ fontWeight: '500' }}>{i + 1}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.frameEditArtContainer}
            onPress={() => {
              sendInspectorAction('setActiveToolWithOptions', {
                id: draw2Behavior.behaviorId,
                selectedFrame: i + 1,
              });
            }}>
            <MCIcon name="pencil-outline" size={20} color="#000" />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Artwork</Text>

      <ScrollView horizontal style={{ flexDirection: 'row', marginBottom: 20 }}>
        {frames}
        <EditArtButton />
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
        propName="framesPerSecond"
        label="Frames per second"
        sendAction={sendAction}
      />
    </View>
  );
};
