import * as React from 'react';
import { StyleSheet, TextInput, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 8,
  },
  input: {
    borderWidth: 1,
    color: '#000',
    borderColor: '#333',
    padding: 8,
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
      <Text style={styles.label}>Tags</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} />
    </View>
  );
};
