import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { BehaviorHeader } from '../components/BehaviorHeader';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

export default InspectorSliding = ({ behavior }) => {
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Sliding');
  const sendAction = React.useCallback(
    (...args) => sendBehaviorAction('Sliding', ...args),
    [sendBehaviorAction]
  );
  const [slidingDirection, sendSlidingDirection] = useOptimisticBehaviorValue({
    component,
    propName: 'direction',
    propType: 'string',
    sendAction,
  });
  const [isRotationAllowed, sendIsRotationAllowed] = useOptimisticBehaviorValue({
    component,
    propName: 'isRotationAllowed',
    propType: 'b',
    sendAction,
  });

  const composeSlidingDirection = (horiz, vert) => {
    if (horiz === vert) {
      if (horiz) {
        sendSlidingDirection('set', 'both');
      } else {
        sendSlidingDirection('set', 'none');
      }
    } else {
      sendSlidingDirection('set', horiz ? 'horizontal' : 'vertical');
    }
  };

  const isHorizChecked = slidingDirection === 'horizontal' || slidingDirection === 'both';
  const isVertChecked = slidingDirection === 'vertical' || slidingDirection === 'both';
  const onChangeHoriz = (value) => composeSlidingDirection(value, isVertChecked);
  const onChangeVert = (value) => composeSlidingDirection(isHorizChecked, value);

  return (
    <View style={SceneCreatorConstants.styles.behaviorContainer}>
      <BehaviorHeader
        name="Axis Lock"
        behavior={behavior}
        component={component}
        sendAction={sendAction}
      />
      <View style={SceneCreatorConstants.styles.behaviorProperties}>
        <InspectorCheckbox
          value={isHorizChecked}
          onChange={onChangeHoriz}
          label="Moves horizontally"
          style={{ marginBottom: 12 }}
        />
        <InspectorCheckbox
          value={isVertChecked}
          onChange={onChangeVert}
          label="Moves vertically"
          style={{ marginBottom: 12 }}
        />
        <InspectorCheckbox
          value={isRotationAllowed}
          onChange={(value) => sendIsRotationAllowed('set', value)}
          label="Rotates"
          style={{ marginBottom: 12 }}
        />
      </View>
    </View>
  );
};
