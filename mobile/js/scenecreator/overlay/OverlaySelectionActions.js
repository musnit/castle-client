import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useCardCreator } from '../CreateCardContext';
import { useCoreState, sendAsync } from '../../core/CoreEvents';
import { OverlayDrawingFramePicker } from './OverlayDrawingFramePicker';

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
    overflow: 'hidden',
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

  const changeOrderOptions = {
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

  const onSelectGrab = React.useCallback(() => {
    sendAction('setDefaultModeCurrentTool', { stringValue: 'grab' });
  }, [sendAction]);
  const onSelectScaleRotate = React.useCallback(() => {
    sendAction('setDefaultModeCurrentTool', { stringValue: 'scaleRotate' });
  }, [sendAction]);
  const onSelectTextContent = React.useCallback(() => {
    sendAction('setDefaultModeCurrentTool', { stringValue: 'textContent' });
  }, [sendAction]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={{ flexDirection: 'column' }}>
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
          {isTextActorSelected ? (
            <Pressable
              style={[
                styles.button,
                currentTool === 'textContent' ? { backgroundColor: '#000' } : null,
                { paddingLeft: 3 },
              ]}
              onPress={onSelectTextContent}>
              <MCIcon
                name="playlist-edit"
                size={26}
                color={currentTool === 'textContent' ? '#fff' : '#000'}
              />
            </Pressable>
          ) : null}
        </View>
        <OverlayDrawingFramePicker />
      </View>
      <View style={{ flexDirection: 'column' }}>
        {currentTool != 'scaleRotate' ? (
          <>
            <Pressable
              style={[styles.button, styles.singleButton]}
              onPress={() => sendAction('duplicateSelection')}>
              <Constants.CastleIcon name="clone" size={22} color="#000" />
            </Pressable>
            <Pressable
              style={[styles.button, styles.singleButton]}
              onPress={() => sendAction('deleteSelection')}>
              <Constants.CastleIcon name="trash" size={22} color="#000" />
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
