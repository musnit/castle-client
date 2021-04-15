import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Feather from 'react-native-vector-icons/Feather';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderColor: Constants.colors.grayOnBlackBorder,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 6,
    borderColor: Constants.colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  searchIcon: {
    paddingLeft: 6,
  },
  input: {
    color: Constants.colors.white,
    padding: 8,
    width: '100%',
  },
  cancelButton: {
    flexShrink: 0,
    paddingLeft: 16,
  },
  cancel: {
    color: Constants.colors.white,
  },
});

// TODO: actually search something
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
      <View style={styles.inputWrapper}>
        <Feather name="search" color={Constants.colors.white} size={20} style={styles.searchIcon} />
        <TextInput
          ref={textInputRef}
          style={styles.input}
          autoCapitalize="none"
          placeholder="Search for people..."
          placeholderTextColor={Constants.colors.white}
          onFocus={onTextInputFocus}
          onBlur={onTextInputBlur}
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
