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

export const RuleParamInputRow = ({ entryPath, label, paramSpec, style, ...props }) => {
  const paramLabel = paramSpec?.label ?? label;
  if (paramSpec.type === 'b') {
    // special-case-toggle: compact the UI onto a single row
    return (
      <View style={[styles.container, style]}>
        <View style={styles.inputRow}>
          <ParamInput entryPath={entryPath} paramSpec={paramSpec} {...props} label={paramLabel} />
        </View>
      </View>
    );
  } else {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.labelRow}>
          <Text style={styles.inputLabel}>{paramLabel}</Text>
        </View>
        <View style={styles.inputRow}>
          <ParamInput entryPath={entryPath} paramSpec={paramSpec} {...props} />
        </View>
      </View>
    );
  }
};
