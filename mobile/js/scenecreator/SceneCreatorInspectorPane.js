import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useGhostUI } from '../ghost/GhostUI';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { getPaneData, sendDataPaneAction } from '../Tools';
import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from '../Constants';

import SceneCreatorPane from './SceneCreatorPane';
import { ToolPane } from '../Tools';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginTop: 4,
    borderRadius: 1000,
  },
  closeButton: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});

const InspectorActions = ({ pane, visible }) => {
  const { showActionSheetWithOptions } = useActionSheet();

  let data, sendAction;
  if (pane) {
    sendAction = (action, value) => sendDataPaneAction(pane, action, value);
    data = getPaneData(pane);
  }

  const changeSelectionOrder = React.useCallback(() => {
    const options = [
      {
        name: 'Move Forward',
        action: () => sendAction('moveSelectionForward'),
      },
      {
        name: 'Move Backward',
        action: () => sendAction('moveSelectionBackward'),
      },
      {
        name: 'Move to Front',
        action: () => sendAction('moveSelectionToFront'),
      },
      {
        name: 'Move to Back',
        action: () => sendAction('moveSelectionToBack'),
      },
    ];
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

  if (data) {
    let drawButton;
    if (Array.isArray(data.applicableTools)) {
      const drawBehavior = data.applicableTools.find((behavior) => behavior.name === 'Draw');
      const grabBehavior = data.applicableTools.find((behavior) => behavior.name === 'Grab');
      if (drawBehavior) {
        const isDrawSelected = data.activeToolBehaviorId === drawBehavior.behaviorId;
        const onPress = () =>
          sendAction(
            'setActiveTool',
            isDrawSelected ? grabBehavior.behaviorId : drawBehavior.behaviorId
          );
        drawButton = (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isDrawSelected ? '#000' : '#fff' }]}
            onPress={onPress}>
            <Icon name="edit" size={22} color={isDrawSelected ? '#fff' : '#000'} />
          </TouchableOpacity>
        );
      }
    }
    return (
      <View pointerEvents={visible ? 'auto' : 'none'} style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => sendAction('closeInspector')}>
          <Icon name="close" size={32} color="#000" />
        </TouchableOpacity>
        <View style={styles.actions}>
          {drawButton}
          <TouchableOpacity style={styles.actionButton} onPress={changeSelectionOrder}>
            <Icon name="layers" size={22} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => sendAction('duplicateSelection')}>
            <Icon name="content-copy" size={22} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => sendAction('deleteSelection')}>
            <Icon name="delete" size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return null;
};

export default SceneCreatorInspectorPane = ({ element, visible, context }) => {
  const { root } = useGhostUI();
  const actionsPane = root.panes.sceneCreatorInspectorActions;

  // Do this so we can show last visible elements while animating out
  const [lastVisibleElements, setLastVisibleElements] = useState({ element, actionsPane });
  useEffect(() => {
    if (visible) {
      setLastVisibleElements({ element, actionsPane });
    }
  }, [visible, element, actionsPane]);

  const renderHeader = () => (
    <InspectorActions
      visible={visible}
      pane={visible ? actionsPane : lastVisibleElements.actionsPane}
    />
  );

  return (
    <SceneCreatorPane
      visible={visible}
      element={
        visible
          ? element
          : {
              ...lastVisibleElements.element,
              props: { ...lastVisibleElements.element.props },
            }
      }
      context={context}
      renderHeader={renderHeader}
      persistLastSnapWhenOpened
    />
  );
};
