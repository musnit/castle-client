import React from 'react';
import { InspectorActorRefInput } from './InspectorActorRefInput';
import { InspectorCheckbox } from './InspectorCheckbox';
import { InspectorDropdown } from './InspectorDropdown';
import { InspectorInlineExpressionInput } from '../expressions/InspectorInlineExpressionInput';
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
  let { type } = paramSpec;
  if (type === 'string' && paramSpec.attribs.allowedValues?.length) {
    type = 'dropdown';
  }

  switch (type) {
    case 'f':
    case 'i':
    case 'd':
      // expressions forbidden by paramSpec, only allow primitive number
      return (
        <InspectorNumberInput value={value} onChange={setValue} {...paramSpec.attribs} {...props} />
      );
    case 'expression':
      // TODO: more expressions besides numeric
      return (
        <ExpressionInputComponent
          value={value}
          onChange={setValue}
          {...paramSpec.attribs}
          {...props}
        />
      );
    case 'tagPicker': // TODO: tagPicker
      return (
        <InspectorTagPicker value={value} onChange={setValue} {...paramSpec.attribs} {...props} />
      );
    case 'b':
      return (
        <InspectorCheckbox value={value} onChange={setValue} {...paramSpec.attribs} {...props} />
      );
    case 'string':
    case 'textArea': // TODO: textArea
      return (
        <InspectorTextInput
          optimistic
          value={value}
          onChangeText={setValue}
          multiline={paramSpec.method === 'textArea'}
          {...paramSpec.attribs}
          {...props}
        />
      );
    case 'variable':
      return (
        <InspectorVariablePicker
          value={value}
          onChange={setValue}
          {...paramSpec.attribs}
          {...props}
        />
      );
    case 'dropdown':
      return (
        <InspectorDropdown value={value} onChange={setValue} {...paramSpec.attribs} {...props} />
      );
    case 'actorRef': // TODO: actorRef
      return (
        <InspectorActorRefInput
          value={value}
          onChange={setValue}
          {...paramSpec.attribs}
          {...props}
        />
      );
    default:
      throw new Error(`Input type ${paramSpec.type} is not supported in ParamInput`);
  }
};
