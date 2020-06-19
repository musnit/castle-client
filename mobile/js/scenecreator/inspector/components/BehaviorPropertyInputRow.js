import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorNumberInput } from '../components/InspectorNumberInput';

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  inputLabel: {},
});

export const BehaviorPropertyInputRow = ({ behavior, propName, label, sendAction }) => {
  const propertySpec = behavior.propertySpecs[propName];
  if (propertySpec?.method !== 'numberInput') {
    // TODO: support toggle in addition to numberInput
    return null;
  }

  const [value, sendValue] = useOptimisticBehaviorValue({
    behavior,
    propName,
    sendAction,
  });

  const onChange = React.useCallback(
    (value) => {
      if (behavior.isActive) {
        sendValue(`set:${propName}`, value);
      }
    },
    [behavior.isActive, sendValue]
  );

  return (
    <View style={styles.inputContainer}>
      <View style={{ width: '50%' }}>
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <View style={{ width: '50%' }}>
        <InspectorNumberInput value={value} onChange={onChange} {...propertySpec.props} />
      </View>
    </View>
  );
};
