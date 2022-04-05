import React from 'react';
import { StyleSheet, TextInput } from 'react-native';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  textInput: {
    color: Constants.colors.white,
    backgroundColor: Constants.colors.black,
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: Constants.colors.white,
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  disabledTextInput: {
    color: Constants.colors.grayText,
    borderColor: Constants.colors.grayText,
  },
});

export const AuthTextInput = ({ style, editable, inputRef, ...props }) => {
  return (
    <TextInput
      ref={inputRef}
      style={
        editable ? [styles.textInput, style] : [styles.textInput, styles.disabledTextInput, style]
      }
      editable={editable}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
    />
  );
};
