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

export const CommentInput = () => (
  <View style={styles.container}>
    <TextInput style={styles.textInput} placeholder="Add a comment..." multiline />
    <Pressable style={styles.submitButton}>
      <MCIcon name="send" color="#999" size={24} />
    </Pressable>
  </View>
);
