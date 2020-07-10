import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InspectorCheckbox } from './InspectorCheckbox';
import { InspectorDropdown } from './InspectorDropdown';
import { InspectorNumberInput } from './InspectorNumberInput';
import { InspectorTextInput } from './InspectorTextInput';
import { InspectorVariablePicker } from './InspectorVariablePicker';

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

export const RuleParamInputRow = ({ label, paramSpec, value, setValue, ...props }) => {
  let input;
  switch (paramSpec.method) {
    case 'numberInput':
      input = (
        <InspectorNumberInput value={value} onChange={setValue} {...paramSpec.props} {...props} />
      );
      break;
    case 'toggle':
      input = (
        <InspectorCheckbox value={value} onChange={setValue} {...paramSpec.props} {...props} />
      );
      break;
    case 'textInput':
      input = (
        <InspectorTextInput value={value} onChangeText={setValue} {...paramSpec.props} {...props} />
      );
      break;
    case 'dropdown':
      if (paramSpec.props?.showVariablesItems) {
        input = (
          <InspectorVariablePicker
            value={value}
            onChange={setValue}
            {...paramSpec.props}
            {...props}
          />
        );
      } else {
        input = (
          <InspectorDropdown value={value} onChange={setValue} {...paramSpec.props} {...props} />
        );
      }
      break;
    default:
      throw new Error(`Input type ${paramSpec.method} is not supported in RuleParamInputRow`);
  }

  return (
    <View style={styles.inputContainer}>
      <View style={{ width: '50%' }}>
        <Text style={styles.inputLabel}>{paramSpec?.label ?? label}</Text>
      </View>
      <View style={{ width: '50%' }}>{input}</View>
    </View>
  );
};
