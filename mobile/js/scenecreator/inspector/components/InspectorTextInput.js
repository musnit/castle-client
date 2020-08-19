import * as React from 'react';
import { StyleSheet, TextInput } from 'react-native';

import * as Constants from '../../../Constants';

export const InspectorTextInput = ({ style, ...props }) => {
  let value = props.value;
  if (value && typeof value !== 'string') {
    value = '';
  }
  return (
    <TextInput
      style={[Constants.styles.textInputOnWhite, style]}
      placeholderTextColor={Constants.colors.grayText}
      {...props}
    />
  );
};
