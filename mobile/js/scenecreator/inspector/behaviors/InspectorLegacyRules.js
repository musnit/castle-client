import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGhostUI } from '../../../ghost/GhostUI';
import { ToolPane } from '../../../Tools';

const styles = StyleSheet.create({
  addButton: {
    borderWidth: 1,
    borderBottomWidth: 2,
    borderRadius: 3,
    borderColor: '#000',
    padding: 8,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontWeight: 'bold',
  },
});

export default InspectorLegacyRules = ({ rules, sendAction }) => {
  if (!rules.isActive) {
    return (
      <TouchableOpacity style={styles.addButton} onPress={() => sendAction('add')}>
        <Text style={styles.addLabel}>Add rules</Text>
      </TouchableOpacity>
    );
  }
  const { root } = useGhostUI();
  const element = root?.panes ? root.panes['sceneCreatorRules'] : null;

  if (!element) return null;
  return <ToolPane element={element} context={{}} />;
};
