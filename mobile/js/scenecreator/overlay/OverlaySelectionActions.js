import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { sendAsync } from '../../core/CoreEvents';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useCardCreator } from '../CreateCardContext';

import FeatherIcon from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from '../../Constants';
import * as SceneCreatorConstants from '../SceneCreatorConstants';
const CastleIcon = Constants.CastleIcon;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  close: {
    borderRadius: SceneCreatorConstants.OVERLAY_BORDER_RADIUS,
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    ...Constants.styles.dropShadow,
  },
  toolbar: {
    borderRadius: SceneCreatorConstants.OVERLAY_BORDER_RADIUS,
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    ...Constants.styles.dropShadow,
  },
  button: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const makeChangeOrderOptions = ({ isTextActorSelected, sendAction }) => {
  if (isTextActorSelected) {
    return [
      {
        name: 'Move to Top',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_TEXT_ORDER', change: 'top' }),
      },
      {
        name: 'Move Up',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_TEXT_ORDER', change: 'up' }),
      },
      {
        name: 'Move Down',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_TEXT_ORDER', change: 'down' }),
      },
      {
        name: 'Move to Bottom',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_TEXT_ORDER', change: 'bottom' }),
      },
    ];
  } else {
    return [
      {
        name: 'Bring to Front',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_DRAW_ORDER', change: 'front' }),
      },
      {
        name: 'Bring Forward',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_DRAW_ORDER', change: 'forward' }),
      },
      {
        name: 'Send Backward',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_DRAW_ORDER', change: 'backward' }),
      },
      {
        name: 'Send to Back',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_DRAW_ORDER', change: 'back' }),
      },
    ];
  }
};

export const OverlaySelectionActions = () => {
  const { isTextActorSelected } = useCardCreator();
  const sendAction = React.useCallback(
    (action, ...args) => {
      if (typeof action === 'string') {
        sendAsync('EDITOR_INSPECTOR_ACTION', { action, ...args });
      } else if (action.eventName) {
        const { eventName, ...params } = action;
        sendAsync(eventName, params);
      }
    },
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

  const scaleRotateAction = () => {
    sendAction('toggleScaleRotate');
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={[styles.close, styles.button]}>
        <Pressable onPress={() => sendAction('closeInspector')}>
          <CastleIcon name="close" size={22} color="#000" />
        </Pressable>
      </View>
      <View style={styles.toolbar}>
        <Pressable style={styles.button} onPress={scaleRotateAction}>
          <Icon name="crop-rotate" size={20} color="#000" />
        </Pressable>
        <Pressable style={styles.button} onPress={changeSelectionOrder}>
          {isTextActorSelected ? (
            <Icon name="swap-vert" size={20} color="#000" />
          ) : (
            <FeatherIcon name="layers" size={20} color="#000" />
          )}
        </Pressable>
        <Pressable style={styles.button} onPress={() => sendAction('duplicateSelection')}>
          <FeatherIcon name="copy" size={20} color="#000" />
        </Pressable>
        <Pressable
          style={[styles.button, { borderRightWidth: 0 }]}
          onPress={() => sendAction('deleteSelection')}>
          <FeatherIcon name="trash-2" size={20} color="#000" />
        </Pressable>
      </View>
    </View>
  );
};
