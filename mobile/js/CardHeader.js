import React, { Fragment } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import SLIcon from 'react-native-vector-icons/SimpleLineIcons';
import { useGhostUI } from './ghost/GhostUI';

import { paneVisible } from './scenecreator/SceneCreatorUtilities';
import { getPaneData, sendDataPaneAction } from './Tools';

import * as Constants from './Constants';

const PANE_KEY = 'sceneCreatorGlobalActions';

const styles = StyleSheet.create({
  container: {
    zIndex: 1, // we use negative margin to place the scene behind the header
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionsContainer: {
    width: '100%',
    height: '100%',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -54, // required to center properly with back button
    zIndex: -1, // required to prevent negative margin from blocking back button
  },
  action: {
    paddingHorizontal: 4,
  },
});

const CardHeader = ({ card, isEditable, onPressBack, mode, onChangeMode }) => {
  const { root } = useGhostUI();
  let playPauseButton, undoButton, redoButton;
  if (root.panes && paneVisible(root.panes[PANE_KEY])) {
    const pane = root.panes[PANE_KEY];
    const data = getPaneData(pane);

    playPauseButton = data.performing ? (
      <TouchableOpacity style={styles.action} onPress={() => sendDataPaneAction(pane, 'onRewind')}>
        <SLIcon name="control-start" size={22} color="#fff" />
      </TouchableOpacity>
    ) : (
      <TouchableOpacity style={styles.action} onPress={() => sendDataPaneAction(pane, 'onPlay')}>
        <SLIcon name="control-play" size={22} color="#fff" />
      </TouchableOpacity>
    );

    undoButton = (
      <TouchableOpacity
        style={styles.action}
        disabled={!data.actionsAvailable.onUndo}
        onPress={() => sendDataPaneAction(pane, 'onUndo')}>
        <MCIcon
          name="undo-variant"
          size={26}
          color={data.actionsAvailable.onUndo ? '#fff' : '#666'}
        />
      </TouchableOpacity>
    );

    redoButton = (
      <TouchableOpacity
        style={styles.action}
        disabled={!data.actionsAvailable.onRedo}
        onPress={() => sendDataPaneAction(pane, 'onRedo')}>
        <MCIcon
          name="redo-variant"
          size={26}
          color={data.actionsAvailable.onRedo ? '#fff' : '#666'}
        />
      </TouchableOpacity>
    );
  }
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <TouchableOpacity style={styles.back} onPress={onPressBack}>
        <Icon name="close" size={32} color="#fff" />
      </TouchableOpacity>
      <View style={styles.actionsContainer}>
        {playPauseButton}
        {undoButton}
        {redoButton}
        <TouchableOpacity
          style={styles.action}
          onPress={() => onChangeMode(mode === 'variables' ? 'card' : 'variables')}>
          <MCIcon name="variable" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CardHeader;
