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
  },
});

export default InspectorTextLayout = ({ text, sendAction }) => {
  const [value, setValueAndSendAction] = useOptimisticBehaviorValue({
    behavior: text,
    propName: 'visible',
    sendAction,
  });

  const onChange = React.useCallback(
    (visible) => {
      setValueAndSendAction('set:visible', visible);
    },
    [setValueAndSendAction]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Layout</Text>
      <InspectorCheckbox value={value} onChange={onChange} label="Visible when the card starts" />
    </View>
  );
};
