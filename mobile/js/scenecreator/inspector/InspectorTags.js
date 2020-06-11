import * as React from 'react';
import { StyleSheet, TextInput, Text, View } from 'react-native';

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
  const value = tags.properties.tagsString;
  const onChange = React.useCallback(
    (tagsString) => {
      if (tags.isActive) {
        if (tagsString && tagsString.length) {
          // change property if nonempty
          sendAction('set:tagsString', tagsString);
        } else {
          // or remove tags if empty
          sendAction('remove');
        }
      } else {
        if (tagsString && tagsString.length) {
          // add tags if nonempty
          sendAction('add', { tagsString });
        }
      }
    },
    [tags.isActive, sendAction]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} />
    </View>
  );
};
