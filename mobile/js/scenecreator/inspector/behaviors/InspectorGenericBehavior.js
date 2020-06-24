import * as React from 'react';
import { View } from 'react-native';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';
import { BehaviorHeader } from '../components/BehaviorHeader';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

export default InspectorGenericBehavior = ({ behavior, sendAction, properties }) => {
  properties = properties ?? Object.keys(behavior.propertySpecs);
  return (
    <View style={SceneCreatorConstants.styles.behaviorContainer}>
      <BehaviorHeader name={behavior.displayName} onRemove={() => sendAction('remove')} />
      {properties?.length ? (
        <View style={SceneCreatorConstants.styles.behaviorProperties}>
          {properties.map((propName, ii) => (
            <BehaviorPropertyInputRow
              key={`${behavior.name}-property-${ii}`}
              behavior={behavior}
              propName={propName}
              label={behavior.propertySpecs[propName].label}
              sendAction={sendAction}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};
