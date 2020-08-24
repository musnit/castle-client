import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PopoverButton } from '../../PopoverProvider';
import { DropdownItemsList } from './InspectorDropdown';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  box: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    padding: 8,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activeBox: {
    borderBottomWidth: 1,
    marginBottom: 1,
    borderStyle: 'dashed',
  },
  label: {
    fontSize: 16,
  },
});

export const InspectorVariablePicker = ({ value, label, onChange, style, context, ...props }) => {
  const items = context.variables || [];
  let selectedItem;
  if (value && value !== 'none') {
    selectedItem = items.find((item) => item.id === value);
  }
  const popover = {
    Component: DropdownItemsList,
    items,
    selectedItem,
    height: 192,
    onSelectItem: (item) => onChange(item.id),
  };

  let valueLabel = selectedItem ? selectedItem.name : '(none)';

  return (
    <View style={[styles.container, style]} {...props}>
      <Text style={styles.label}>{label}</Text>
      <PopoverButton
        style={styles.box}
        activeStyle={[styles.box, styles.activeBox]}
        popover={popover}>
        <Text>{valueLabel}</Text>
      </PopoverButton>
    </View>
  );
};
