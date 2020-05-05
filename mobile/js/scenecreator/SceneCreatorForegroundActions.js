import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useGhostUI } from '../ghost/GhostUI';

import { paneVisible } from './SceneCreatorUtilities';
import { getPaneData, sendDataPaneAction } from '../Tools';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
});

const PANE_KEY = 'sceneCreatorGlobalActions';

export default SceneCreatorForegroundActions = () => {
  const { root, transformAssetUri } = useGhostUI();
  if (root.panes && paneVisible(root.panes[PANE_KEY])) {
    const pane = root.panes[PANE_KEY];
    const data = getPaneData(pane);

    return (
      <View style={styles.container}>
        {data.performing ? (
          <TouchableOpacity onPress={() => sendDataPaneAction(pane, 'onRewind')}>
            <Icon name="stop" size={32} color="#fff" style={Constants.styles.dropShadow} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => sendDataPaneAction(pane, 'onPlay')}>
            <Icon name="play-arrow" size={32} color="#fff" style={Constants.styles.dropShadow} />
          </TouchableOpacity>
        )}
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            disabled={!data.actionsAvailable.onUndo}
            onPress={() => sendDataPaneAction(pane, 'onUndo')}>
            <Icon name="undo" size={32} color="#fff" style={Constants.styles.dropShadow} />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!data.actionsAvailable.onRedo}
            onPress={() => sendDataPaneAction(pane, 'onRedo')}>
            <Icon name="redo" size={32} color="#fff" style={Constants.styles.dropShadow} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return null;
};
