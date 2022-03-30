import * as React from 'react';
import { View } from 'react-native';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';

export default InspectorCounter = ({ counter }) => {
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Counter');
  const sendAction = React.useCallback(
    (...args) => sendBehaviorAction('Counter', ...args),
    [sendBehaviorAction]
  );
  return (
    <View style={{ marginTop: 12 }}>
      <BehaviorPropertyInputRow
        behavior={counter}
        component={component}
        propName="value"
        label="Initial value"
        min={counter.propertySpecs.minValue}
        max={counter.propertySpecs.maxValue}
        sendAction={sendAction}
      />
      <BehaviorPropertyInputRow
        behavior={counter}
        component={component}
        propName="minValue"
        label="Minimum value"
        max={counter.propertySpecs.maxValue}
        sendAction={sendAction}
      />
      <BehaviorPropertyInputRow
        behavior={counter}
        component={component}
        propName="maxValue"
        label="Maximum value"
        min={counter.propertySpecs.minValue}
        sendAction={sendAction}
      />
    </View>
  );
};
