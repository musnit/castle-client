import React from 'react';
import { InspectorCheckbox } from './InspectorCheckbox';
import { InspectorDropdown } from './InspectorDropdown';
import { InspectorInlineExpressionInput } from './InspectorInlineExpressionInput';
import { InspectorNumberInput } from './InspectorNumberInput';
import { InspectorTagPicker } from './InspectorTagPicker';
import { InspectorTextInput } from './InspectorTextInput';
import { InspectorVariablePicker } from './InspectorVariablePicker';

// given a paramSpec,
// render the correct input

export const ParamInput = ({
  paramSpec,
  value,
  setValue,
  ExpressionInputComponent = InspectorInlineExpressionInput,
  ...props
}) => {
  switch (paramSpec.method) {
    case 'numberInput':
      if (paramSpec.expression === false) {
        // expressions forbidden by paramSpec, only allow primitive number
        return (
          <InspectorNumberInput value={value} onChange={setValue} {...paramSpec.props} {...props} />
        );
      } else {
        // TODO: more expressions besides numeric
        return (
          <ExpressionInputComponent
            value={value}
            onChange={setValue}
            {...paramSpec.props}
            {...props}
          />
        );
      }
      break;
    case 'tagPicker':
      return (
        <InspectorTagPicker value={value} onChange={setValue} {...paramSpec.props} {...props} />
      );
      break;
    case 'toggle':
      return (
        <InspectorCheckbox value={value} onChange={setValue} {...paramSpec.props} {...props} />
      );
      break;
    case 'textInput':
    case 'textArea':
      return (
        <InspectorTextInput
          optimistic
          value={value}
          onChangeText={setValue}
          multiline={paramSpec.method === 'textArea'}
          {...paramSpec.props}
          {...props}
        />
      );
      break;
    case 'dropdown':
      if (paramSpec.props?.showVariablesItems) {
        return (
          <InspectorVariablePicker
            value={value}
            onChange={setValue}
            {...paramSpec.props}
            {...props}
          />
        );
      } else {
        return (
          <InspectorDropdown value={value} onChange={setValue} {...paramSpec.props} {...props} />
        );
      }
      break;
    default:
      throw new Error(`Input type ${paramSpec.method} is not supported in ParamInput`);
  }
};
