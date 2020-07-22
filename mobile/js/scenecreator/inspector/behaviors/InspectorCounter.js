import * as React from 'react';
import { View } from 'react-native';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';
import { BehaviorHeader } from '../components/BehaviorHeader';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

export default InspectorCounter = ({ counter, sendAction }) => {
  return (
    <View style={SceneCreatorConstants.styles.behaviorContainer}>
      <BehaviorHeader name="Counter" behavior={counter} sendAction={sendAction} />
      <View style={SceneCreatorConstants.styles.behaviorProperties}>
        <BehaviorPropertyInputRow
          behavior={counter}
          propName="value"
          label="Initial value"
          min={counter.properties.minValue}
          max={counter.properties.maxValue}
          sendAction={sendAction}
        />
        <BehaviorPropertyInputRow
          behavior={counter}
          propName="minValue"
          label="Minimum value"
          max={counter.properties.maxValue}
          sendAction={sendAction}
        />
        <BehaviorPropertyInputRow
          behavior={counter}
          propName="maxValue"
          label="Maximum value"
          min={counter.properties.minValue}
          sendAction={sendAction}
        />
      </View>
    </View>
  );
};
