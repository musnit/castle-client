import React from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  Pressable,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { useCoreState, sendGlobalAction, sendAsync } from '../core/CoreEvents';
import { useActionSheet } from '@expo/react-native-action-sheet';

import * as Constants from '../Constants';
import * as SceneCreatorConstants from './SceneCreatorConstants';

import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import SLIcon from 'react-native-vector-icons/SimpleLineIcons';
const CastleIcon = Constants.CastleIcon;

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
    width: 68,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 12,
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
  onPressSettings,
  onSave,
  onSaveAndGoToDeck,
  isCardChanged,
  loading,
  creatorUsername,
  saveAction,
}) => {
  const data = useCoreState('EDITOR_GLOBAL_ACTIONS') || {
    performing: false,
    editMode: 'default',
    actionsAvailable: {},
  };

  const { showActionSheetWithOptions } = useActionSheet();
  const maybeClone = React.useCallback(() => {
    showActionSheetWithOptions(
      {
        title: `Start a remix of @${creatorUsername}'s deck and copy it to your create screen?`,
        options: ['Remix', 'Cancel'],
        cancelButtonIndex: 1,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          return onSaveAndGoToDeck();
        }
      }
    );
  }, [showActionSheetWithOptions, onSaveAndGoToDeck, creatorUsername]);

  return (
    <View style={styles.container}>
      {/*
SafeArea tracks StatusBar height inconsistently on android between devices, messing up the scene height.
So just hide the StatusBar on Android.
https://github.com/th3rdwave/react-native-safe-area-context/issues/124
       */}
      <StatusBar barStyle="dark-content" hidden={Constants.Android} />
      {!data.performing ? (
        <TouchableOpacity style={styles.back} onPress={onPressBack}>
          <CastleIcon name="back" size={22} color="#000" />
        </TouchableOpacity>
      ) : null}
      <View
        style={[
          styles.actionsContainer,
          data.performing ? styles.actionsContainerPerforming : null,
        ]}>
        {data.performing ? (
          <>
            <TouchableOpacity style={styles.action} onPress={() => sendGlobalAction('onRewind')}>
              <CastleIcon name="rewind" size={22} color="#000" />
            </TouchableOpacity>
          </>
        ) : (
          <>
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
                color={data.actionsAvailable.onUndo ? '#000' : Constants.colors.grayOnWhiteIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.action}
              disabled={!data.actionsAvailable.onRedo}
              onPress={() => sendGlobalAction('onRedo')}>
              <CastleIcon
                name="redo"
                size={22}
                color={data.actionsAvailable.onRedo ? '#000' : Constants.colors.grayOnWhiteIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.action}
              disabled={data.performing || data.editMode !== 'default'}
              onPress={onPressSettings}>
              <CastleIcon
                name="settings"
                size={22}
                color={
                  data.performing || data.editMode !== 'default'
                    ? Constants.colors.grayOnWhiteIcon
                    : '#000'
                }
              />
            </TouchableOpacity>
          </>
        )}
      </View>
      {!data.performing ? (
        saveAction === 'save' ? (
          <Pressable
            style={({ pressed }) => [
              SceneCreatorConstants.styles.button,
              { width: 60, justifyContent: 'center' },
              isCardChanged && !loading && !pressed ? null : { opacity: 0.33, shadowOpacity: 0 },
            ]}
            onPress={onSave}
            disabled={!isCardChanged}>
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={[Constants.styles.primaryButtonLabel, { textAlign: 'center' }]}>
                Save
              </Text>
            )}
          </Pressable>
        ) : saveAction === 'clone' ? (
          <TouchableOpacity style={Constants.styles.primaryButton} onPress={maybeClone}>
            <Text style={Constants.styles.primaryButtonLabel}>Remix</Text>
          </TouchableOpacity>
        ) : (
          <View pointerEvents="none" style={{ width: 60 }} />
        )
      ) : null}
    </View>
  );
};
