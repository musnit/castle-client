import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorCheckbox } from '../components/InspectorCheckbox';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 16,
    fontSize: 16,
  },
});

export default InspectorDrawing = ({ drawing, drawing2, sendAction }) => {
  if (drawing2) {
    // TODO: support drawing2
    return null;
  }

  const [wobble, sendWobble] = useOptimisticBehaviorValue({
    behavior: drawing,
    propName: 'wobble',
    sendAction,
  });

  const onChangeWobble = React.useCallback(
    (wobble) => {
      // TODO: worry about whether we have this behavior?
      sendWobble('set:wobble', wobble);
    },
    [sendWobble]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Drawing</Text>
      <InspectorCheckbox value={wobble} onChange={onChangeWobble} label="Wobble" />
    </View>
  );
};
