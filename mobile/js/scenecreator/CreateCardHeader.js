import React, { Fragment } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { useCoreState, sendGlobalAction } from '../core/CoreEvents';
import { useActionSheet } from '@expo/react-native-action-sheet';

import * as Constants from '../Constants';
import * as SceneCreatorConstants from './SceneCreatorConstants';
import { CreateCardCaptureActions } from './CreateCardCaptureActions';

import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import SLIcon from 'react-native-vector-icons/SimpleLineIcons';
const CastleIcon = SceneCreatorConstants.CastleIcon;

export const CARD_HEADER_HEIGHT = 50;

const styles = StyleSheet.create({
  container: {
    zIndex: 1, // we use negative margin to place the scene behind the header
    height: CARD_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Constants.colors.white,
    paddingRight: 8,
    borderBottomWidth: 1,
    borderColor: Constants.colors.grayOnBlackBorder,
  },
  back: {
    width: 67,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 16,
  },
  actionsContainer: {
    width: '100%',
    height: '100%',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1, // required to prevent negative margin from blocking back button
  },
  actionsContainerPerforming: {
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  action: {
    paddingHorizontal: 8,
  },
});

export const CreateCardHeader = ({
  isEditable,
  onPressBack,
  mode,
  onChangeMode,
  onSave,
  creatorUsername,
  saveAction,
}) => {
  const data = useCoreState('EDITOR_GLOBAL_ACTIONS');

  const { showActionSheetWithOptions } = useActionSheet();
  const maybeClone = React.useCallback(() => {
    showActionSheetWithOptions(
      {
        title: `Save a private copy of @${creatorUsername}'s deck to your own profile?`,
        options: ['Save Copy', 'Cancel'],
        cancelButtonIndex: 1,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          return onSave();
        }
      }
    );
  }, [showActionSheetWithOptions, onSave, creatorUsername]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {!data?.performing ? (
        <TouchableOpacity style={styles.back} onPress={onPressBack}>
          <CastleIcon name="back" size={22} color="#000" />
        </TouchableOpacity>
      ) : null}
      {data ? (
        <View
          style={[
            styles.actionsContainer,
            data.performing ? styles.actionsContainerPerforming : null,
          ]}>
          {data.performing ? (
            <Fragment>
              <TouchableOpacity style={styles.action} onPress={() => sendGlobalAction('onRewind')}>
                <CastleIcon name="play" size={22} color="#000" />
              </TouchableOpacity>
              <CreateCardCaptureActions />
            </Fragment>
          ) : (
            <Fragment>
              <TouchableOpacity style={styles.action} onPress={() => sendGlobalAction('onPlay')}>
                <CastleIcon name="play" size={22} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.action}
                disabled={!data.actionsAvailable.onUndo}
                onPress={() => sendGlobalAction('onUndo')}>
                <CastleIcon
                  name="undo"
                  size={22}
                  color={data.actionsAvailable.onUndo ? '#000' : Constants.colors.grayOnWhiteText}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.action}
                disabled={!data.actionsAvailable.onRedo}
                onPress={() => sendGlobalAction('onRedo')}>
                <CastleIcon
                  name="redo"
                  size={22}
                  color={data.actionsAvailable.onRedo ? '#000' : Constants.colors.grayOnWhiteText}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.action}
                disabled={data.performing}
                onPress={() => onChangeMode(mode === 'variables' ? null : 'variables')}>
                <CastleIcon name="settings" size={22} color="#000" />
              </TouchableOpacity>
            </Fragment>
          )}
        </View>
      ) : null}
      {!data?.performing ? (
        saveAction === 'save' ? (
          <TouchableOpacity style={[SceneCreatorConstants.styles.button]} onPress={onSave}>
            <Text style={Constants.styles.primaryButtonLabel}>Done</Text>
          </TouchableOpacity>
        ) : saveAction === 'clone' ? (
          <TouchableOpacity style={Constants.styles.primaryButton} onPress={maybeClone}>
            <Text style={Constants.styles.primaryButtonLabel}>Remix</Text>
          </TouchableOpacity>
        ) : (
          <View pointerEvents="none" style={{ width: 64 }} />
        )
      ) : null}
    </View>
  );
};
