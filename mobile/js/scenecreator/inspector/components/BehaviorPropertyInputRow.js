import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { getUIProps } from '../../Metadata';
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
  const { type: propType } = propertySpec;
  const [lastNativeUpdate, setLastNativeUpdate] = React.useState(1);
  const [value, sendValue] = useOptimisticBehaviorValue({
    component,
    propName,
    propType,
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
  let type = propType;
  if (type === 'string' && propertySpec.attribs.allowedValues?.length) {
    type = 'dropdown';
  }

  const entryPath = `${behavior.name}.properties.${propName}`;
  const metadata = {
    ...propertySpec.attribs,
    ...getUIProps(entryPath),
    ...props,
  };

  switch (type) {
    case 'f':
    case 'i':
    case 'd':
      input = (
        <InspectorNumberInput
          lastNativeUpdate={lastNativeUpdate}
          value={displayValue(value)}
          onChange={onChange}
          {...metadata}
        />
      );
      break;
    case 'b':
      input = (
        <InspectorCheckbox
          lastNativeUpdate={lastNativeUpdate}
          value={displayValue(value)}
          onChange={onChange}
          {...metadata}
        />
      );
      break;
    case 'dropdown':
      input = (
        <InspectorDropdown
          lastNativeUpdate={lastNativeUpdate}
          value={value}
          onChange={onChange}
          {...metadata}
        />
      );
      break;
    default:
      throw new Error(
        `Input type ${propertySpec.type} is not supported in BehaviorPropertyInputRow`
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
