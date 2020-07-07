import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const styles = StyleSheet.create({
  text: {},
  cell: {
    marginRight: 8,
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
});

export const ConfigureRuleEntry = ({ cells, onPickEntry }) => {
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
                onPress={onPickEntry}>
                <Text style={styles.ruleName}>{cell.label}</Text>
              </TouchableOpacity>
            );
          }
          case 'selectParamSheet': {
            // TODO: open sheet when pressed
            return (
              <TouchableOpacity key={key} style={[styles.cell, styles.select]} onPress={() => {}}>
                <Text style={styles.ruleName}>{cell.label}</Text>
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
