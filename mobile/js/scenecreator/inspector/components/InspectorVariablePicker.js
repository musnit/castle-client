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
  label: {
    fontSize: 16,
  },
});

export const InspectorVariablePicker = ({ value, label, onChange, style, context, ...props }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const items = context.variables || [];
  const onPress = React.useCallback(() => {
    showActionSheetWithOptions(
      {
        options: items.map((item) => item.name).concat(['Cancel']),
        cancelButtonIndex: items.length,
      },
      (i) => {
        if (typeof i === 'number' && i >= 0 && i < items.length) {
          onChange(items[i].id);
        }
      }
    );
  }, [showActionSheetWithOptions, onChange]);

  let valueLabel = '(none)';
  if (value && value !== 'none') {
    const selected = items.find((item) => item.id === value);
    valueLabel = selected ? selected.name : value;
  }
  return (
    <View style={[styles.container, style]} {...props}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={onPress} style={styles.box}>
        <Text>{valueLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};
