import * as React from 'react';
import { StyleSheet, TextInput } from 'react-native';

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderTopWidth: 2,
    borderRadius: 4,
    color: '#000',
    borderColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
  },
});

export const InspectorTextInput = ({ style, ...props }) => {
  return <TextInput style={[styles.input, style]} {...props} />;
};
