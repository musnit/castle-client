import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Feather from 'react-native-vector-icons/Feather';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 4,
    borderColor: Constants.colors.grayOnBlackBorder,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    paddingLeft: 6,
  },
  input: {
    color: Constants.colors.white,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 10,
    fontSize: 16,
  },
  cancelButton: {
    paddingLeft: 16,
  },
  cancel: {
    color: Constants.colors.white,
    fontSize: 16,
  },
});

export const SearchInput = ({ onFocus, onCancel, ...props }) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const textInputRef = React.useRef(null);

  const onTextInputFocus = React.useCallback(
    (e) => {
      setIsFocused(true);
      if (onFocus) {
        onFocus(e);
      }
    },
    [onFocus]
  );
  const onTextInputBlur = React.useCallback(
    (e) => {
      setIsFocused(false);
      if (onCancel) {
        onCancel();
      }
    },
    [onCancel]
  );
  const cancelSearch = React.useCallback(() => {
    if (textInputRef.current) {
      textInputRef.current.blur();
    }
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, isFocused ? { flex: 1 } : null]}>
        <Feather name="search" color={Constants.colors.white} size={20} style={styles.searchIcon} />
        <TextInput
          ref={textInputRef}
          style={styles.input}
          autoCapitalize="none"
          placeholder="Search"
          placeholderTextColor={Constants.colors.white}
          onFocus={onTextInputFocus}
          onBlur={onTextInputBlur}
          blurOnSubmit={false}
          {...props}
        />
      </View>
      {isFocused ? (
        <Pressable style={styles.cancelButton} onPress={cancelSearch}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      ) : null}
    </View>
  );
};
