import * as React from 'react';
import { View, Text } from 'react-native';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';
import { BehaviorHeader } from '../components/BehaviorHeader';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

export default InspectorLocalVariables = ({}) => {
  let component = useCoreState('EDITOR_SELECTED_COMPONENT:LocalVariables');
  if (!component) {
    component = { props: { localVariables: [] } };
  }
  const sendAction = React.useCallback(
    (...args) => sendBehaviorAction('LocalVariables', ...args),
    [sendBehaviorAction]
  );
  return (
    <View style={SceneCreatorConstants.styles.behaviorContainer}>
      <Text>{JSON.stringify(component.props)}</Text>
    </View>
  );
};
