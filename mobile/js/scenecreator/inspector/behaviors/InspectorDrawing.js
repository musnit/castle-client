import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useCardCreator } from '../../CreateCardContext';

import FastImage from 'react-native-fast-image';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    alignItems: 'flex-start',
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 16,
    fontSize: 16,
  },
  image: {
    width: 64,
    height: 64,
    marginRight: 8,
    marginBottom: 8,
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
  return (
    <View style={styles.container}>
      {drawing2?.properties?.base64Png ? (
        <FastImage
          source={{ uri: `data:image/png;base64,${drawing2.properties.base64Png}` }}
          style={styles.image}
        />
      ) : null}
      <EditArtButton />
    </View>
  );
};
