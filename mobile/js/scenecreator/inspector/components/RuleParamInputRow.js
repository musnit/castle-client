import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ParamInput } from './ParamInput';

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
  },
});

export const RuleParamInputRow = ({ label, paramSpec, style, ...props }) => {
  return (
    <View style={[styles.inputContainer, style]}>
      <View style={{ width: '50%' }}>
        <Text style={styles.inputLabel}>{paramSpec?.label ?? label}</Text>
      </View>
      <View style={{ width: '50%' }}>
        <ParamInput paramSpec={paramSpec} {...props} />
      </View>
    </View>
  );
};
