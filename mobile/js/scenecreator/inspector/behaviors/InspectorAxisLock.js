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
  // TODO: add fixedRotation from body
  /* const [fixedRotation, sendFixedRotation] = useOptimisticBehaviorValue({
    body,
    propName: 'fixedRotation',
    sendAction: sendActions.Body,
    }); */

  // TODO: support 'both' (in this case just doesn't create a joint in lua, but preserves sliding behavior)
  const isHorizChecked = slidingDirection === 'horizontal';
  const isVertChecked = slidingDirection === 'vertical';
  const onChangeHoriz = (value) =>
    sendSlidingDirection('set:direction', value ? 'horizontal' : 'vertical');
  const onChangeVert = (value) =>
    sendSlidingDirection('set:direction', value ? 'vertical' : 'horizontal');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Axis lock</Text>
      <InspectorCheckbox
        value={isHorizChecked}
        onChange={onChangeHoriz}
        label="Moves horizontally"
      />
      <InspectorCheckbox value={isVertChecked} onChange={onChangeVert} label="Moves vertically" />
    </View>
  );
};
