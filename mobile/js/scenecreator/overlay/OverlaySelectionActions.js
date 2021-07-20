import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { sendAsync } from '../../core/CoreEvents';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useCardCreator } from '../CreateCardContext';

import FeatherIcon from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  close: {
    height: 36,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
  },
  toolbar: {
    height: 36,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
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

  return (
    <View style={styles.container}>
      <View style={[styles.close, styles.button]}>
        <Pressable onPress={() => sendAction('closeInspector')}>
          <Icon name="close" size={28} color="#000" />
        </Pressable>
      </View>
      <View style={styles.toolbar}>
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
        <Pressable style={styles.button} onPress={() => sendAction('deleteSelection')}>
          <FeatherIcon name="trash-2" size={18} color="#000" />
        </Pressable>
      </View>
    </View>
  );
};
