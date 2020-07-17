import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BehaviorHeader } from '../components/BehaviorHeader';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

export default InspectorSliding = ({ behavior, sendAction }) => {
  const [slidingDirection, sendSlidingDirection] = useOptimisticBehaviorValue({
    behavior,
    propName: 'direction',
    sendAction,
  });
  const [isRotationAllowed, sendIsRotationAllowed] = useOptimisticBehaviorValue({
    behavior,
    propName: 'isRotationAllowed',
    sendAction,
  });

  const composeSlidingDirection = (horiz, vert) => {
    if (horiz === vert) {
      if (horiz) {
        sendSlidingDirection('set:direction', 'both');
      } else {
        sendSlidingDirection('set:direction', 'none');
      }
    } else {
      sendSlidingDirection('set:direction', horiz ? 'horizontal' : 'vertical');
    }
  };

  const isHorizChecked = slidingDirection === 'horizontal' || slidingDirection === 'both';
  const isVertChecked = slidingDirection === 'vertical' || slidingDirection === 'both';
  const onChangeHoriz = (value) => composeSlidingDirection(value, isVertChecked);
  const onChangeVert = (value) => composeSlidingDirection(isHorizChecked, value);

  return (
    <View style={SceneCreatorConstants.styles.behaviorContainer}>
      <BehaviorHeader name="Axis Lock" onRemove={() => sendAction('remove')} />
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
          onChange={(value) => sendIsRotationAllowed('set:isRotationAllowed', value)}
          label="Rotates"
          style={{ marginBottom: 12 }}
        />
      </View>
    </View>
  );
};
