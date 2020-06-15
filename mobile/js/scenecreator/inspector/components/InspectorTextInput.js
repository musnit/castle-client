import * as React from 'react';
import { StyleSheet, TextInput } from 'react-native';

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderTopWidth: 2,
    borderRadius: 3,
    color: '#000',
    borderColor: '#333',
    padding: 8,
  },
});

export const InspectorTextInput = ({ style, ...props }) => {
  return <TextInput style={[styles.input, style]} {...props} />;
};
