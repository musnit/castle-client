import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InspectorTagPicker } from '../components/InspectorTagPicker';
import { useCardCreator } from '../../CreateCardContext';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 16,
    fontSize: 16,
  },
});

export default InspectorTags = ({ tags, sendAction }) => {
  const context = useCardCreator();
  const [value, setValueAndSendAction] = useOptimisticBehaviorValue({
    behavior: tags,
    propName: 'tagsString',
    sendAction,
  });

  const onChange = React.useCallback(
    (tagsString) => {
      if (tags.isActive) {
        setValueAndSendAction('set:tagsString', tagsString);
      } else {
        console.warn(`Expect all actors to have Tags, but this actor did not`);
        setValueAndSendAction('add', tagsString, { tagsString });
      }
    },
    [tags.isActive, sendAction, setValueAndSendAction]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags</Text>
      <InspectorTagPicker value={value} onChange={onChange} context={context} />
    </View>
  );
};
