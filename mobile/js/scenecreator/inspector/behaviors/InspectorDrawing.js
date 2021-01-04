import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useCardCreator } from '../../CreateCardContext';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';

import FastImage from 'react-native-fast-image';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    flex: 1,
  },
  image: {
    width: 96,
    height: 96,
    marginBottom: 8,
    backgroundColor: '#0001',
    borderWidth: 1,
    borderColor: '#ccc',
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
    marginBottom: 8,
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
    onPress = () => sendAction('setActiveTool', draw2Behavior.behaviorId);
  } else {
    console.warn(`Tried to render InspectorDrawing for an actor that has no drawing`);
    onPress = () => {};
  }

  return (
    <TouchableOpacity style={SceneCreatorConstants.styles.button} onPress={onPress}>
      <Text style={SceneCreatorConstants.styles.buttonLabel}>Edit Art</Text>
    </TouchableOpacity>
  );
};

export default InspectorDrawing = ({ drawing2, sendAction }) => {
  const [loopStyle, loopStyleSetValueAndSendAction] = useOptimisticBehaviorValue({
    behavior: drawing2,
    propName: 'loopStyle',
    sendAction,
  });

  const items = [
    {
      name: 'Still',
      onSelect: () => {
        loopStyleSetValueAndSendAction('set:loopStyle', 0);
      },
    },
    {
      name: 'Play Once',
      onSelect: () => {
        loopStyleSetValueAndSendAction('set:loopStyle', 1);
      },
    },
    {
      name: 'Loop',
      onSelect: () => {
        loopStyleSetValueAndSendAction('set:loopStyle', 2);
      },
    },
  ];
  const selectedItemIndex = loopStyle;
  const onChange = (index) => {
    if (index !== selectedItemIndex) {
      items[index].onSelect();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Artwork</Text>

      <View style={{ flexDirection: 'row' }}>
        {drawing2?.properties?.base64Png ? (
          <FastImage
            source={{ uri: `data:image/png;base64,${drawing2.properties.base64Png}` }}
            style={styles.image}
          />
        ) : null}
        <View style={{ paddingLeft: 20, height: 40 }}>
          <EditArtButton />
        </View>
      </View>

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
