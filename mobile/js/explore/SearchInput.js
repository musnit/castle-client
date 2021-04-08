import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Feather from 'react-native-vector-icons/Feather';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: Constants.colors.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    paddingLeft: 4,
  },
  input: {
    color: Constants.colors.white,
    padding: 8,
    width: '100%',
    flexShrink: 1,
  },
  cancelButton: {
    flexShrink: 0,
    paddingRight: 8,
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
      {isFocused ? (
        <TouchableOpacity style={styles.cancelButton} onPress={cancelSearch}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
