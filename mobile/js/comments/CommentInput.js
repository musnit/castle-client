import * as React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  textInput: {
    width: '100%',
    flexShrink: 1,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
  },
  submitButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export const CommentInput = ({ onAddComment }) => {
  const [value, setValue] = React.useState();
  const addComment = React.useCallback((message) => {
    onAddComment(message);
    setValue(undefined);
  }, []);
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        placeholder="Add a comment..."
        value={value}
        onChangeText={setValue}
        multiline
      />
      <Pressable
        style={styles.submitButton}
        onPress={() => addComment(value)}
        disabled={!value || value.length === 0}>
        <MCIcon name="send" color={value?.length > 0 ? '#000' : '#999'} size={24} />
      </Pressable>
    </View>
  );
};
