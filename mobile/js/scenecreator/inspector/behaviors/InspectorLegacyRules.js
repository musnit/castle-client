import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGhostUI } from '../../../ghost/GhostUI';
import { registerElement, ToolPane } from '../../../Tools';

import CardDestinationPickerSheet from '../../CardDestinationPickerSheet';
import CardPickerTool from '../components/CardPickerTool';
import { Counter } from './InspectorBehaviors';

registerElement('cardPicker', CardPickerTool);

const styles = StyleSheet.create({
  addButton: {
    borderWidth: 1,
    borderBottomWidth: 2,
    borderRadius: 3,
    borderColor: '#000',
    padding: 8,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontWeight: 'bold',
  },
});

const LegacyRules = ({ rules, sendAction, addChildSheet }) => {
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

export default InspectorLegacyRules = ({ counter, rules, sendActions, addChildSheet }) => {
  return (
    <React.Fragment>
      {!counter.isActive ? (
        <TouchableOpacity style={styles.addButton} onPress={() => sendActions.Counter('add')}>
          <Text style={styles.addLabel}>Enable counter</Text>
        </TouchableOpacity>
      ) : null}
      <LegacyRules rules={rules} sendAction={sendActions.Rules} addChildSheet={addChildSheet} />
      {counter.isActive ? <Counter counter={counter} sendAction={sendActions.Counter} /> : null}
    </React.Fragment>
  );
};
