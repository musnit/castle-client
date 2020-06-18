import React, { Fragment } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import SLIcon from 'react-native-vector-icons/SimpleLineIcons';
import { useGhostUI } from './ghost/GhostUI';

import * as Constants from './Constants';

export const CARD_HEADER_HEIGHT = 54;

const styles = StyleSheet.create({
  container: {
    zIndex: 1, // we use negative margin to place the scene behind the header
    height: CARD_HEADER_HEIGHT,
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
    paddingHorizontal: 8,
  },
});

export const CardHeader = ({ card, isEditable, onPressBack, mode, onChangeMode }) => {
  const { globalActions, sendGlobalAction } = useGhostUI();
  let playPauseButton, undoButton, redoButton, isPlaying;
  if (globalActions) {
    const data = globalActions;
    isPlaying = data.performing;

    playPauseButton = data.performing ? (
      <TouchableOpacity style={styles.action} onPress={() => sendGlobalAction('onRewind')}>
        <SLIcon name="control-start" size={22} color="#fff" />
      </TouchableOpacity>
    ) : (
      <TouchableOpacity style={styles.action} onPress={() => sendGlobalAction('onPlay')}>
        <SLIcon name="control-play" size={22} color="#fff" />
      </TouchableOpacity>
    );

    undoButton = (
      <TouchableOpacity
        style={styles.action}
        disabled={!data.actionsAvailable.onUndo}
        onPress={() => sendGlobalAction('onUndo')}>
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
        onPress={() => sendGlobalAction('onRedo')}>
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
          disabled={isPlaying}
          onPress={() => onChangeMode(mode === 'variables' ? null : 'variables')}>
          <MCIcon name="variable" size={26} color={isPlaying ? '#666' : '#fff'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
