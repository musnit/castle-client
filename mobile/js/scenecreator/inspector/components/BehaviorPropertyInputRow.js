import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorCheckbox } from './InspectorCheckbox';
import { InspectorDropdown } from './InspectorDropdown';
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
  component,
  propName,
  label,
  sendAction,
  displayValue,
  style,
  ...props
}) => {
  // optional method to transform the value shown
  displayValue = displayValue ?? ((value) => value);

  const propertySpec = behavior.propertySpecs[propName];
  const [lastNativeUpdate, setLastNativeUpdate] = React.useState(1);
  const [value, sendValue] = useOptimisticBehaviorValue({
    component,
    propName,
    sendAction,
    onNativeUpdate: () => setLastNativeUpdate(lastNativeUpdate + 1),
  });

  const onChange = React.useCallback(
    (value) => {
      if (behavior.isActive) {
        sendValue('set', propName, value);
      }
    },
    [behavior.isActive, sendValue]
  );

  // TODO: merge with ParamInput component
  let input;
  switch (propertySpec.type) {
    case 'f':
    case 'i':
    case 'd':
      input = (
        <InspectorNumberInput
          lastNativeUpdate={lastNativeUpdate}
          value={displayValue(value)}
          onChange={onChange}
          {...propertySpec.attribs}
          {...props}
        />
      );
      break;
    case 'b':
      input = (
        <InspectorCheckbox
          lastNativeUpdate={lastNativeUpdate}
          value={displayValue(value)}
          onChange={onChange}
          {...propertySpec.attribs}
          {...props}
        />
      );
      break;
    // TODO: check propspec's allowedValues
    case 'dropdown':
      input = (
        <InspectorDropdown
          lastNativeUpdate={lastNativeUpdate}
          value={value}
          onChange={onChange}
          {...propertySpec.attribs}
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
    <View style={[styles.inputContainer, style]}>
      <View style={{ width: '50%' }}>
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <View style={{ width: '50%' }}>{input}</View>
    </View>
  );
};
