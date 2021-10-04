import * as React from 'react';
import { View } from 'react-native';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';
import { BehaviorHeader } from '../components/BehaviorHeader';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

export default InspectorCounter = ({ counter }) => {
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Counter');
  const sendAction = React.useCallback(
    (...args) => sendBehaviorAction('Counter', ...args),
    [sendBehaviorAction]
  );
  return (
    <View style={SceneCreatorConstants.styles.behaviorContainer}>
      <BehaviorHeader
        name="Counter"
        behavior={counter}
        component={component}
        sendAction={sendAction}
      />
      <View style={[SceneCreatorConstants.styles.behaviorPropertySpecs, { paddingHorizontal: 16 }]}>
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
    </View>
  );
};
