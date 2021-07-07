import * as React from 'react';
import { View } from 'react-native';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';
import { BehaviorHeader } from '../components/BehaviorHeader';
import { getUIProps } from '../../Metadata';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

export default InspectorGenericBehavior = ({ behavior, properties }) => {
  const component = useCoreState(`EDITOR_SELECTED_COMPONENT:${behavior.name}`);
  const sendAction = React.useCallback((...args) => sendBehaviorAction(behavior.name, ...args), [
    sendBehaviorAction,
  ]);
  properties = properties ?? Object.keys(behavior.propertySpecs);
  return (
    <View style={SceneCreatorConstants.styles.behaviorContainer}>
      <BehaviorHeader behavior={behavior} component={component} sendAction={sendAction} />
      {component && properties?.length ? (
        <View style={SceneCreatorConstants.styles.behaviorProperties}>
          {properties.map((propName, ii) => {
            const uiProps = getUIProps(`${behavior.name}.properties.${propName}`);
            return (
              <BehaviorPropertyInputRow
                key={`${behavior.name}-property-${ii}`}
                behavior={behavior}
                component={component}
                propName={propName}
                label={behavior.propertySpecs[propName].attribs.label}
                sendAction={sendAction}
                {...uiProps}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
};
