import React from 'react';
import { getUIProps } from '../../Metadata';
import { InspectorActorRefInput } from './InspectorActorRefInput';
import { InspectorCheckbox } from './InspectorCheckbox';
import { InspectorDropdown } from './InspectorDropdown';
import { InspectorInlineExpressionInput } from '../expressions/InspectorInlineExpressionInput';
import { InspectorNumberInput } from './InspectorNumberInput';
import { InspectorPatternPicker } from './InspectorPatternPicker';
import { InspectorTagPicker } from './InspectorTagPicker';
import { InspectorTextInput } from './InspectorTextInput';
import { InspectorVariablePicker } from './InspectorVariablePicker';

import * as SceneCreatorUtilities from '../../SceneCreatorUtilities';

// given a paramSpec,
// render the correct input

export const ParamInput = ({
  entryPath,
  paramSpec,
  value,
  setValue,
  ExpressionInputComponent = InspectorInlineExpressionInput,
  ...props
}) => {
  let { type } = paramSpec;
  if ((type === 'string' || type === 'quantize') && paramSpec.attribs.allowedValues?.length) {
    type = 'dropdown';
  }

  const metadata = {
    ...paramSpec.attribs,
    ...getUIProps(entryPath),
    ...props,
  };

  if (metadata.expression === false && type === 'expression') {
    // we explicitly disallow expressions for this param, regardless of
    // what type is provided at the engine level
    type = 'd';
  }

  if (metadata.type) {
    type = metadata.type;
  }

  switch (type) {
    case 'f':
    case 'i':
    case 'd':
      // expressions forbidden by paramSpec, only allow primitive number
      return <InspectorNumberInput value={value} onChange={setValue} {...metadata} />;
    case 'expression':
      // TODO: more expressions besides numeric
      return <ExpressionInputComponent value={value} onChange={setValue} {...metadata} />;
    case 'tag':
      return <InspectorTagPicker value={value} singleSelect onChange={setValue} {...metadata} />;
    case 'tags':
      return <InspectorTagPicker value={value} onChange={setValue} {...metadata} />;
    case 'b':
      return <InspectorCheckbox value={value} onChange={setValue} {...metadata} />;
    case 'string':
    case 'textArea':
      return (
        <InspectorTextInput
          optimistic
          value={value}
          onChangeText={setValue}
          multiline={type === 'textArea'}
          {...metadata}
        />
      );
    case 'variable':
      return <InspectorVariablePicker value={value} onChange={setValue} {...metadata} />;
    case 'pattern':
      return <InspectorPatternPicker value={value} onChange={setValue} {...metadata} />;
    case 'comparison':
      return (
        <InspectorDropdown
          value={value}
          onChange={setValue}
          {...metadata}
          allowedValues={SceneCreatorUtilities.getComparisonOperators()}
        />
      );
    case 'dropdown':
      return <InspectorDropdown value={value} onChange={setValue} {...metadata} />;
    case 'actorRef':
      return <InspectorActorRefInput value={value} onChange={setValue} {...metadata} />;
    default:
      throw new Error(`Input type ${paramSpec.type} is not supported in ParamInput`);
  }
};
