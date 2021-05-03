import * as React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  container: { borderTopWidth: 1, borderColor: '#ddd', flexDirection: 'row', alignItems: 'center' },
  textInput: {
    width: '100%',
    flexShrink: 1,
    padding: 16,
    marginTop: 8,
  },
  submitButton: {
    marginRight: 16,
  },
});

export const CommentInput = () => (
  <View style={styles.container}>
    <TextInput style={styles.textInput} placeholder="Add a comment..." multiline />
    <Pressable style={styles.submitButton}>
      <MCIcon name="send-circle" color="#333" size={32} />
    </Pressable>
  </View>
);
