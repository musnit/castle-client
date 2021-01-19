import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ParamInput } from './ParamInput';

const styles = StyleSheet.create({
  container: {},
  inputRow: {
    padding: 12,
  },
  labelRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  inputLabel: {
    fontSize: 16,
  },
});

export const RuleParamInputRow = ({ label, paramSpec, style, ...props }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.inputLabel}>{paramSpec?.label ?? label}</Text>
      </View>
      <View style={styles.inputRow}>
        <ParamInput paramSpec={paramSpec} {...props} />
      </View>
    </View>
  );
};
