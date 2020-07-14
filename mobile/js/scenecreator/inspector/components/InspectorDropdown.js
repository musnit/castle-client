import * as React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { objectToArray } from '../../../Tools';
import { PopoverButton } from '../../PopoverProvider';

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
    borderRadius: 4,
    padding: 8,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  item: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    padding: 16,
  },
});

export const DropdownItemsList = ({ items, selectedItem, onSelectItem, closePopover }) => {
  return (
    <ScrollView>
      {items &&
        items.map((item, ii) => (
          <TouchableOpacity
            key={`item-${ii}`}
            style={styles.item}
            onPress={() => {
              onSelectItem(item);
              closePopover();
            }}>
            <Text style={item === selectedItem ? { fontWeight: 'bold' } : null}>{item.name}</Text>
          </TouchableOpacity>
        ))}
    </ScrollView>
  );
};

export const InspectorDropdown = ({ value, onChange, style, ...props }) => {
  const items = objectToArray(props?.items ?? []).map((item) => ({ id: item, name: item }));
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

  const valueLabel = selectedItem ? selectedItem.name : '(none)';
  return (
    <View style={[styles.container, style]} {...props}>
      <PopoverButton style={styles.box} popover={popover}>
        <Text>{valueLabel}</Text>
      </PopoverButton>
    </View>
  );
};
