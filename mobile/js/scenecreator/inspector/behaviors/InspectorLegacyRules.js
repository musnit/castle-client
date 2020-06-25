import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGhostUI } from '../../../ghost/GhostUI';
import { registerElement, ToolPane } from '../../../Tools';

import CardDestinationPickerSheet from '../../CardDestinationPickerSheet';
import CardPickerTool from '../components/CardPickerTool';

registerElement('cardPicker', CardPickerTool);

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

export default InspectorLegacyRules = ({ rules, sendAction, addChildSheet }) => {
  if (!rules.isActive) {
    return (
      <TouchableOpacity style={styles.addButton} onPress={() => sendAction('add')}>
        <Text style={styles.addLabel}>Add rules</Text>
      </TouchableOpacity>
    );
  }
  const { root } = useGhostUI();
  const element = root?.panes ? root.panes['sceneCreatorRules'] : null;

  const showDestinationPicker = (callback) =>
    addChildSheet({
      key: 'destinationPicker',
      Component: CardDestinationPickerSheet,
      onSelectCard: (card) =>
        callback({
          cardId: card.cardId,
          title: card.title,
        }),
    });

  if (!element) return null;
  return <ToolPane element={element} context={{ showDestinationPicker }} />;
};
