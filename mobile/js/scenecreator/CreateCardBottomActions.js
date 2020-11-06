import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';

import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import * as Constants from '../Constants';

export const CARD_BOTTOM_MIN_HEIGHT = 64;

const styles = StyleSheet.create({
  actions: {
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: CARD_BOTTOM_MIN_HEIGHT,
  },
});

export const CreateCardBottomActions = ({
  card,
  onAdd,
  onOpenLayout,
  onSave,
  isPlayingScene,
  isSceneLoaded,
  saveAction,
  creatorUsername,
}) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const maybeClone = React.useCallback(() => {
    showActionSheetWithOptions(
      {
        title: `Save a private copy of @${creatorUsername}'s deck to your own profile?`,
        options: ['Save Copy', 'Cancel'],
        cancelButtonIndex: 1,
      },
      (buttonIndex) => {
        if (buttonIndex == 0) {
          return onSave();
        }
      }
    );
  }, [onSave, creatorUsername]);

  if (isPlayingScene || !isSceneLoaded) {
    return null;
  }

  return (
    <View style={styles.actions}>
      <TouchableOpacity style={Constants.styles.primaryButton} onPress={onAdd}>
        <MCIcon
          name="shape-polygon-plus"
          size={22}
          color="#000"
          style={Constants.styles.primaryButtonIconLeft}
        />
        <Text style={Constants.styles.primaryButtonLabel}>Add</Text>
      </TouchableOpacity>
      <TouchableOpacity style={Constants.styles.secondaryButton} onPress={onOpenLayout}>
        <Icon
          name="grid-on"
          size={22}
          color="#fff"
          style={Constants.styles.secondaryButtonIconLeft}
        />
        <Text style={Constants.styles.secondaryButtonLabel}>Layout</Text>
      </TouchableOpacity>
      {saveAction === 'save' ? (
        <TouchableOpacity style={Constants.styles.primaryButton} onPress={onSave}>
          <Text style={Constants.styles.primaryButtonLabel}>Done</Text>
          <MCIcon
            name="arrow-right"
            size={22}
            color="#000"
            style={Constants.styles.primaryButtonIconRight}
          />
        </TouchableOpacity>
      ) : saveAction === 'clone' ? (
        <TouchableOpacity style={Constants.styles.primaryButton} onPress={maybeClone}>
          <MCIcon
            name="directions-fork"
            size={22}
            color="#000"
            style={Constants.styles.primaryButtonIconLeft}
          />
          <Text style={Constants.styles.primaryButtonLabel}>Remix</Text>
        </TouchableOpacity>
      ) : (
        <View pointerEvents="none" style={{ width: 64 }} />
      )}
    </View>
  );
};
