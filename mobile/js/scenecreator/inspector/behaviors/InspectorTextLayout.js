import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';

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

export default InspectorTextLayout = () => {
  const textComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Text');
  const sendAction = React.useCallback((...args) => sendBehaviorAction('Text', ...args), [
    sendBehaviorAction,
  ]);

  const [value, setValueAndSendAction] = useOptimisticBehaviorValue({
    behavior: textComponent,
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
      <InspectorCheckbox value={value} onChange={onChange} label="Visible" />
    </View>
  );
};
