import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useCardCreator } from '../CreateCardContext';
import { useCoreState, sendAsync } from '../../core/CoreEvents';

import FeatherIcon from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import * as Constants from '../../Constants';
import * as SceneCreatorConstants from '../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  toolbar: {
    borderRadius: SceneCreatorConstants.OVERLAY_BORDER_RADIUS,
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    flexDirection: 'column',
    alignItems: 'center',
    ...Constants.styles.dropShadow,
  },
  singleButton: {
    borderRadius: SceneCreatorConstants.OVERLAY_BORDER_RADIUS,
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    ...Constants.styles.dropShadow,
    marginBottom: 8,
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
    return {
      front: {
        name: 'Move to Top',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_TEXT_ORDER', change: 'top' }),
      },
      forward: {
        name: 'Move Up',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_TEXT_ORDER', change: 'up' }),
      },
      backward: {
        name: 'Move Down',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_TEXT_ORDER', change: 'down' }),
      },
      back: {
        name: 'Move to Bottom',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_TEXT_ORDER', change: 'bottom' }),
      },
    };
  } else {
    return {
      front: {
        name: 'Bring to Front',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_DRAW_ORDER', change: 'front' }),
      },
      forward: {
        name: 'Bring Forward',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_DRAW_ORDER', change: 'forward' }),
      },
      backward: {
        name: 'Send Backward',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_DRAW_ORDER', change: 'backward' }),
      },
      back: {
        name: 'Send to Back',
        action: () => sendAction({ eventName: 'EDITOR_CHANGE_DRAW_ORDER', change: 'back' }),
      },
    };
  }
};

export const OverlaySelectionActions = () => {
  const globalActions = useCoreState('EDITOR_GLOBAL_ACTIONS');
  const currentTool = globalActions?.defaultModeCurrentTool ?? 'grab';

  const { isTextActorSelected } = useCardCreator();
  const sendAction = React.useCallback(
    (action, args) => {
      if (typeof action === 'string') {
        sendAsync('EDITOR_INSPECTOR_ACTION', { action, ...args });
      } else if (action.eventName) {
        const { eventName, ...params } = action;
        sendAsync(eventName, params);
      }
    },
    [sendAsync]
  );

  const changeOrderOptions = makeChangeOrderOptions({ isTextActorSelected, sendAction });
  const onSelectGrab = React.useCallback(() => {
    sendAction('setDefaultModeCurrentTool', { stringValue: 'grab' });
  }, [sendAction]);
  const onSelectScaleRotate = React.useCallback(() => {
    sendAction('setDefaultModeCurrentTool', { stringValue: 'scaleRotate' });
  }, [sendAction]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.toolbar}>
        <Pressable
          style={[styles.button, currentTool === 'grab' ? { backgroundColor: '#000' } : null]}
          onPress={onSelectGrab}>
          <FeatherIcon
            name="mouse-pointer"
            size={22}
            color={currentTool === 'grab' ? '#fff' : '#000'}
          />
        </Pressable>
        <Pressable
          style={[
            styles.button,
            currentTool === 'scaleRotate' ? { backgroundColor: '#000' } : null,
          ]}
          onPress={onSelectScaleRotate}>
          <Icon
            name="crop-rotate"
            size={22}
            color={currentTool === 'scaleRotate' ? '#fff' : '#000'}
          />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'column' }}>
        {currentTool === 'grab' ? (
          <>
            <Pressable
              style={[styles.button, styles.singleButton]}
              onPress={() => sendAction('duplicateSelection')}>
              <FeatherIcon name="copy" size={20} color="#000" />
            </Pressable>
            <Pressable
              style={[styles.button, styles.singleButton]}
              onPress={() => sendAction('deleteSelection')}>
              <FeatherIcon name="trash-2" size={20} color="#000" />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              style={[styles.button, styles.singleButton]}
              onPress={changeOrderOptions.front.action}>
              <MCIcon name="arrow-collapse-up" size={20} color="#000" />
            </Pressable>
            <Pressable
              style={[styles.button, styles.singleButton]}
              onPress={changeOrderOptions.forward.action}>
              <MCIcon name="arrow-up" size={20} color="#000" />
            </Pressable>
            <Pressable
              style={[styles.button, styles.singleButton]}
              onPress={changeOrderOptions.backward.action}>
              <MCIcon name="arrow-down" size={20} color="#000" />
            </Pressable>
            <Pressable
              style={[styles.button, styles.singleButton]}
              onPress={changeOrderOptions.back.action}>
              <MCIcon name="arrow-collapse-down" size={20} color="#000" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
};
