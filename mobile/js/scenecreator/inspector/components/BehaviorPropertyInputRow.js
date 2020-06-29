import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorCheckbox } from './InspectorCheckbox';
import { InspectorNumberInput } from './InspectorNumberInput';

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

export const BehaviorPropertyInputRow = ({
  behavior,
  propName,
  label,
  sendAction,
  displayValue,
  ...props
}) => {
  // optional method to transform the value shown
  displayValue = displayValue ?? ((value) => value);

  const propertySpec = behavior.propertySpecs[propName];
  const [lastNativeUpdate, setLastNativeUpdate] = React.useState(1);
  const [value, sendValue] = useOptimisticBehaviorValue({
    behavior,
    propName,
    sendAction,
    onNativeUpdate: () => setLastNativeUpdate(lastNativeUpdate + 1),
  });

  const onChange = React.useCallback(
    (value) => {
      if (behavior.isActive) {
        sendValue(`set:${propName}`, value);
      }
    },
    [behavior.isActive, sendValue]
  );

  let input;
  switch (propertySpec.method) {
    case 'numberInput':
      input = (
        <InspectorNumberInput
          lastNativeUpdate={lastNativeUpdate}
          value={displayValue(value)}
          onChange={onChange}
          {...propertySpec.props}
          {...props}
        />
      );
      break;
    case 'toggle':
      input = (
        <InspectorCheckbox
          lastNativeUpdate={lastNativeUpdate}
          value={displayValue(value)}
          onChange={onChange}
          {...propertySpec.props}
          {...props}
        />
      );
      break;
    default:
      throw new Error(
        `Input type ${propertySpec.method} is not supported in BehaviorPropertyInputRow`
      );
  }

  return (
    <View style={styles.inputContainer}>
      <View style={{ width: '50%' }}>
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <View style={{ width: '50%' }}>{input}</View>
    </View>
  );
};
