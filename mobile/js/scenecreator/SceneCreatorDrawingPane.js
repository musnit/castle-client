import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useGhostUI } from '../ghost/GhostUI';

import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from '../Constants';

import SceneCreatorPane from './SceneCreatorPane';

const styles = StyleSheet.create({
  closeButton: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});

// scene creator behaviors can be "tools" which have their own UI.
// right now the only example is drawing.

export default SceneCreatorDrawingPane = ({ element, visible, context }) => {
  // TODO: once drawing is a data pane, we don't have to subscribe to
  // the root UI here and can just use actions available on `element`
  const { sendGlobalAction } = useGhostUI();

  const renderHeader = () => (
    <View
      style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
        borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
        paddingTop: 8,
      }}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => sendGlobalAction('resetActiveTool')}>
        <Icon name="close" size={32} color="#000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SceneCreatorPane
      visible={visible}
      element={element}
      context={context}
      renderHeader={renderHeader}
    />
  );
};
