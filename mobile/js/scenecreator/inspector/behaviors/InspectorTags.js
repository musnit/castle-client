import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorTextInput } from '../components/InspectorTextInput';

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
  sublabel: {
    fontWeight: 'normal',
  },
});

export default InspectorTags = ({ tags, sendAction }) => {
  const [value, setValueAndSendAction] = useOptimisticBehaviorValue({
    behavior: tags,
    propName: 'tagsString',
    sendAction,
  });

  const onChange = React.useCallback(
    (tagsString) => {
      if (tags.isActive) {
        if (tagsString && tagsString.length) {
          // change property if nonempty
          setValueAndSendAction('set:tagsString', tagsString);
        } else {
          // or remove tags if empty
          setValueAndSendAction('remove', null);
        }
      } else {
        if (tagsString && tagsString.length) {
          // add tags if nonempty
          setValueAndSendAction('add', tagsString, { tagsString });
        }
      }
    },
    [tags.isActive, sendAction, setValueAndSendAction]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags <Text style={styles.sublabel}>(separated by spaces)</Text></Text>
      <InspectorTextInput value={value} onChangeText={onChange} />
    </View>
  );
};
