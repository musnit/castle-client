import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { InspectorTagPicker } from '../components/InspectorTagPicker';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    flex: 1,
  },
  label: {
    fontWeight: '600',
    paddingBottom: 16,
    fontSize: 16,
  },
});

export default InspectorTags = ({ tags }) => {
  const tagsComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Tags');
  const sendAction = React.useCallback(
    (...args) => sendBehaviorAction('Tags', ...args),
    [sendBehaviorAction]
  );

  const [value, setValueAndSendAction] = useOptimisticBehaviorValue({
    component: tagsComponent,
    propName: 'tagsString',
    propType: 'string',
    sendAction,
  });

  const onChange = React.useCallback(
    (tagsString) => {
      if (tagsComponent) {
        setValueAndSendAction('set', tagsString);
      } else {
        console.warn(`Expect all actors to have Tags, but this actor did not`);
        setValueAndSendAction('add', tagsString, { tagsString });
      }
    },
    [tagsComponent, sendAction, setValueAndSendAction]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags</Text>
      <InspectorTagPicker value={value} onChange={onChange} />
    </View>
  );
};
