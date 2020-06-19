import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  title: {
    fontWeight: 'bold',
    paddingBottom: 16,
  },
});

export default InspectorAxisLock = ({ body, sliding, sendActions }) => {
  const [slidingDirection, sendSlidingDirection] = useOptimisticBehaviorValue({
    sliding,
    propName: 'direction',
    sendAction: sendActions.Sliding,
  });
  const [fixedRotation, sendFixedRotation] = useOptimisticBehaviorValue({
    body,
    propName: 'fixedRotation',
    sendAction: sendActions.Body,
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
      <Text style={styles.title}>Axis lock</Text>
      <InspectorCheckbox
        value={isHorizChecked}
        onChange={onChangeHoriz}
        label="Moves horizontally"
      />
      <InspectorCheckbox value={isVertChecked} onChange={onChangeVert} label="Moves vertically" />
      <InspectorCheckbox
        value={!fixedRotation}
        onChange={(value) => sendFixedRotation('set:fixedRotation', !value)}
        label="Rotates"
      />
    </View>
  );
};
