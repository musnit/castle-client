import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText as Text } from '../components/AppText';

import Icon from 'react-native-vector-icons/MaterialIcons';

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
  hint: {
    paddingTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },
  hintIcon: {
    marginRight: 4,
  },
  hintLabel: {
    fontSize: 16,
    paddingTop: 2,
  },
});

export const AuthTextInput = ({
  style,
  editable,
  inputRef,
  hint,
  hintType = 'error',
  ...props
}) => {
  const hintColor = hintType === 'error' ? '#f00' : hintType === 'ok' ? '#0f0' : '#fff';
  const hintIcon = hintType === 'error' ? 'error' : hintType === 'ok' ? 'check-circle' : 'info';
  return (
    <>
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
      {hint ? (
        <View style={styles.hint}>
          <Icon color={hintColor} name={hintIcon} size={16} style={styles.hintIcon} />
          <Text style={[styles.hintLabel, { color: hintColor }]}>{hint}</Text>
        </View>
      ) : null}
    </>
  );
};
