import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { sendAsync } from '../../core/CoreEvents';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useCardCreator } from '../CreateCardContext';

import FeatherIcon from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from '../../Constants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 36,
  },
  close: {
    borderRadius: 6,
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    ...Constants.styles.dropShadow,
  },
  toolbar: {
    borderRadius: 6,
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    ...Constants.styles.dropShadow,
  },
  button: {
    width: 36,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderColor: Constants.colors.black,
  },
});

const makeChangeOrderOptions = ({ isTextActorSelected, sendAction }) => {
  if (isTextActorSelected) {
    return [
      {
        name: 'Move to Top',
        action: () => sendAction('moveSelectionToBack'),
      },
      {
        name: 'Move Up',
        action: () => sendAction('moveSelectionBackward'),
      },
      {
        name: 'Move Down',
        action: () => sendAction('moveSelectionForward'),
      },
      {
        name: 'Move to Bottom',
        action: () => sendAction('moveSelectionToFront'),
      },
    ];
  } else {
    return [
      {
        name: 'Bring to Front',
        action: () => sendAction('moveSelectionToFront'),
      },
      {
        name: 'Bring Forward',
        action: () => sendAction('moveSelectionForward'),
      },
      {
        name: 'Send Backward',
        action: () => sendAction('moveSelectionBackward'),
      },
      {
        name: 'Send to Back',
        action: () => sendAction('moveSelectionToBack'),
      },
    ];
  }
};

export const OverlaySelectionActions = () => {
  // TODO: applicableTools was previously derived from inspector actions
  const applicableTools = null,
    data = {};

  const { isTextActorSelected } = useCardCreator();
  const sendAction = React.useCallback(
    (action, ...args) => sendAsync('EDITOR_INSPECTOR_ACTION', { action, ...args }),
    [sendAsync]
  );
  const { showActionSheetWithOptions } = useActionSheet();

  const changeSelectionOrder = React.useCallback(() => {
    const options = makeChangeOrderOptions({ isTextActorSelected, sendAction });
    showActionSheetWithOptions(
      {
        title: 'Change order',
        options: options.map((option) => option.name).concat(['Cancel']),
        cancelButtonIndex: options.length,
      },
      (buttonIndex) => {
        if (buttonIndex < options.length) {
          return options[buttonIndex].action();
        }
      }
    );
  }, [sendAction]);

  let scaleRotateAction;
  if (applicableTools) {
    // TODO: restore ScaleRotate
    const grabBehavior = applicableTools.find((behavior) => behavior.name === 'Grab');
    const scaleRotateBehavior = applicableTools.find((behavior) => behavior.name === 'ScaleRotate');

    if (scaleRotateBehavior) {
      const isScaleRotatedSelected = data.activeToolBehaviorId === scaleRotateBehavior.behaviorId;
      scaleRotateAction = () =>
        sendAction(
          'setActiveTool',
          isScaleRotatedSelected ? grabBehavior.behaviorId : scaleRotateBehavior.behaviorId
        );
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.close, styles.button]}>
        <Pressable onPress={() => sendAction('closeInspector')}>
          <Icon name="close" size={28} color="#000" />
        </Pressable>
      </View>
      <View style={styles.toolbar}>
        <Pressable style={styles.button} onPress={scaleRotateAction}>
          <Icon name="crop-rotate" size={18} color="#000" />
        </Pressable>
        <Pressable style={styles.button} onPress={changeSelectionOrder}>
          {isTextActorSelected ? (
            <Icon name="swap-vert" size={18} color="#000" />
          ) : (
            <FeatherIcon name="layers" size={18} color="#000" />
          )}
        </Pressable>
        <Pressable style={styles.button} onPress={() => sendAction('duplicateSelection')}>
          <FeatherIcon name="copy" size={18} color="#000" />
        </Pressable>
        <Pressable
          style={[styles.button, { borderRightWidth: 0 }]}
          onPress={() => sendAction('deleteSelection')}>
          <FeatherIcon name="trash-2" size={18} color="#000" />
        </Pressable>
      </View>
    </View>
  );
};
