import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { objectToArray } from '../../../Tools';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  box: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 3,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 16,
  },
});

export const InspectorDropdown = ({ value, onChange, style, ...props }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const onPress = React.useCallback(() => {
    const items = objectToArray(props?.items ?? []);
    showActionSheetWithOptions(
      { options: items.concat(['Cancel']), cancelButtonIndex: items.length },
      (i) => {
        if (typeof i === 'number' && i >= 0 && i < items.length) {
          onChange(items[i]);
        }
      }
    );
  }, [showActionSheetWithOptions, props?.items, onChange]);

  return (
    <View style={[styles.container, style]} {...props}>
      <TouchableOpacity onPress={onPress} style={styles.box}>
        <Text>{value}</Text>
      </TouchableOpacity>
    </View>
  );
};
