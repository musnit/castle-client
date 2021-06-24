import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorTextInput } from '../components/InspectorTextInput';
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

export default InspectorTextContent = () => {
  const textComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Text');
  const sendAction = React.useCallback((...args) => sendBehaviorAction('Text', ...args), [
    sendBehaviorAction,
  ]);

  const [value, setValueAndSendAction] = useOptimisticBehaviorValue({
    component: textComponent,
    propName: 'content',
    propType: 'string',
    sendAction,
  });

  const onChange = React.useCallback(
    (content) => {
      setValueAndSendAction('set', content);
    },
    [setValueAndSendAction]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Content</Text>
      <InspectorTextInput
        value={value}
        onChangeText={onChange}
        placeholder="Once upon a time..."
        multiline
      />
    </View>
  );
};
