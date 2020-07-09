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
    padding: 8,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
  },
  text: {
    fontSize: 16,
  },
  selectText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export const ConfigureRuleEntry = ({
  entry,
  cells,
  onChangeEntry,
  onShowPicker,
  onShowOptions = () => {},
  onChangeParams,
  addChildSheet,
}) => {
  const showEditParamSheet = (paramNames, initialValues, title) =>
    addChildSheet({
      key: 'ruleParamInput',
      Component: RuleParamInputSheet,
      title: title ?? `Edit ${paramNames[0]}`,
      entry,
      paramNames,
      initialValues,
      onChangeParams,
    });

  return (
    <React.Fragment>
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
                onPress={() => onShowPicker(onChangeEntry)}>
                <Text style={styles.selectText}>{cell.label}</Text>
              </TouchableOpacity>
            );
          }
          case 'showEntryOptions': {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, styles.select]}
                onPress={onShowOptions}>
                <Text style={styles.selectText}>{cell.label}</Text>
              </TouchableOpacity>
            );
          }
          case 'selectParamSheet': {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, styles.select]}
                onPress={() => {
                  if (cell.paramNames) {
                    showEditParamSheet(cell.paramNames, cell.paramValues, cell.title);
                  } else {
                    showEditParamSheet(
                      [cell.paramName],
                      { [cell.paramName]: cell.paramValue },
                      cell.title
                    );
                  }
                }}>
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
