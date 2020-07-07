import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import RuleParamInputSheet from './RuleParamInputSheet';

const styles = StyleSheet.create({
  cell: {
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  select: {
    marginRight: 8,
    padding: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
  },
  text: {},
  selectText: {
    fontWeight: 'bold',
  },
});

export const ConfigureRuleEntry = ({
  entry,
  cells,
  onPickEntry,
  onStructureEntry,
  onChangeParam,
  addChildSheet,
}) => {
  const showEditParamSheet = (paramName, initialValue) =>
    addChildSheet({
      key: 'ruleParamInput',
      Component: RuleParamInputSheet,
      title: `Edit ${paramName}`,
      entry,
      paramName,
      initialValue,
      onChangeParam,
    });

  let maybeStructureCell;
  // auto-prepend 'when' or other structural cell if applicable
  if (onStructureEntry) {
    maybeStructureCell = (
      <TouchableOpacity
        key="entry-structure"
        style={[styles.cell, styles.select]}
        onPress={onStructureEntry}>
        <Text style={styles.selectText}>When</Text>
      </TouchableOpacity>
    );
  }
  return (
    <React.Fragment>
      {maybeStructureCell}
      {cells.map((cell, ii) => {
        const key = `entry-cell-${ii}`;
        switch (cell.type) {
          case 'text': {
            return (
              <View key={key} style={styles.cell}>
                <Text style={styles.text}>{cell.label}</Text>
              </View>
            );
          }
          case 'selectEntry': {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, styles.select]}
                onPress={onPickEntry}>
                <Text style={styles.selectText}>{cell.label}</Text>
              </TouchableOpacity>
            );
          }
          case 'selectParamSheet': {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, styles.select]}
                onPress={() => showEditParamSheet(cell.paramName, cell.paramValue)}>
                <Text style={styles.selectText}>{cell.label}</Text>
              </TouchableOpacity>
            );
          }
          default: {
            return (
              <View key={key} style={styles.cell}>
                <Text style={styles.text}>{JSON.stringify(cell, null, 2)}</Text>
              </View>
            );
          }
        }
      })}
    </React.Fragment>
  );
};
