import React from 'react';
import { StyleSheet } from 'react-native';
import { useGhostUI } from '../ghost/GhostUI';

import { paneVisible } from './SceneCreatorUtilities';
import { ToolPane } from '../Tools';

const styles = StyleSheet.create({
  globalActions: {
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
    return (
      <ToolPane
        element={root.panes[PANE_KEY]}
        context={{ transformAssetUri, hideLabels: true, popoverPlacement: 'bottom' }}
        style={styles.globalActions}
      />
    );
  }
  return null;
};
