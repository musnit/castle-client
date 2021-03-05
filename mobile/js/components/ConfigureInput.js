import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
    color: Constants.colors.grayText,
  },
  input: {
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Constants.colors.grayOnWhiteBorder,
    padding: 8,
  },
  footerText: {
    color: Constants.colors.grayText,
    marginTop: 4,
  },
});

export const ConfigureInput = (props) => {
  const { label, footerText } = props;
  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={Constants.colors.grayText} {...props} />
      {footerText ? <Text style={styles.footerText}>{footerText}</Text> : null}
    </View>
  );
};
