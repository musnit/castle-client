import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BehaviorHeader } from '../components/BehaviorHeader';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderRadius: 3,
    borderColor: '#000',
  },
  properties: {
    padding: 16,
  },
});

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

  // TODO: support no movement except rotation
  const composeSlidingDirection = (horiz, vert) => {
    if (horiz === vert) {
      sendSlidingDirection('set:direction', 'both');
    } else {
      sendSlidingDirection('set:direction', horiz ? 'horizontal' : 'vertical');
    }
  };

  const isHorizChecked = slidingDirection !== 'vertical';
  const isVertChecked = slidingDirection !== 'horizontal';
  const onChangeHoriz = (value) => composeSlidingDirection(value, isVertChecked);
  const onChangeVert = (value) => composeSlidingDirection(isHorizChecked, value);

  return (
    <View style={styles.container}>
      <BehaviorHeader name="Axis Lock" />
      <View style={styles.properties}>
        <InspectorCheckbox
          value={isHorizChecked}
          onChange={onChangeHoriz}
          label="Moves horizontally"
        />
        <InspectorCheckbox value={isVertChecked} onChange={onChangeVert} label="Moves vertically" />
        <InspectorCheckbox
          value={isRotationAllowed}
          onChange={(value) => sendIsRotationAllowed('set:isRotationAllowed', value)}
          label="Rotates"
        />
      </View>
    </View>
  );
};
