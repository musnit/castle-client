import * as React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { InspectorTextInput } from './InspectorTextInput';
import { objectToArray } from '../../../ghost/GhostUI';
import { PopoverButton } from '../../PopoverProvider';
import * as Constants from '../../../Constants';

import Icon from 'react-native-vector-icons/MaterialIcons';

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
  activeBox: {
    borderBottomWidth: 1,
    marginBottom: 1,
    borderStyle: 'dashed',
  },
  item: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  selectedItemText: {
    fontWeight: 'bold',
  },
  addItemRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnWhiteBorder,
  },
  addItemInput: { width: '100%', flexShrink: 1 },
  addItemSubmit: {
    flexShrink: 0,
    minWidth: 12,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    marginLeft: 4,
    borderRadius: 4,
  },
});

export const DropdownItemsList = ({
  items,
  selectedItem,
  onSelectItem,
  showAddItem,
  onAddItem,
  closePopover,
}) => {
  const [addItemValue, setAddItemValue] = React.useState();
  return (
    <ScrollView>
      {showAddItem ? (
        <View key="add-item" style={styles.addItemRow}>
          <InspectorTextInput
            value={addItemValue}
            onChangeText={setAddItemValue}
            autoCapitalize="none"
            style={styles.addItemInput}
            placeholder="Add new..."
            returnKeyType="go"
            onSubmitEditing={() => {
              onAddItem(addItemValue);
              closePopover();
            }}
          />
          <TouchableOpacity
            style={styles.addItemSubmit}
            onPress={() => {
              onAddItem(addItemValue);
              closePopover();
            }}>
            <Icon name="add" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      ) : null}
      {items &&
        items.map((item, ii) => (
          <TouchableOpacity
            key={`item-${ii}`}
            style={styles.item}
            onPress={() => {
              onSelectItem(item);
              closePopover();
            }}>
            <View style={styles.itemIcon}>
              {item === selectedItem ? <Icon name="check" size={18} color="#000" /> : null}
            </View>
            <Text style={item === selectedItem ? styles.selectedItemText : null}>{item.name}</Text>
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
      <PopoverButton
        style={styles.box}
        activeStyle={[styles.box, styles.activeBox]}
        popover={popover}>
        <Text>{valueLabel}</Text>
      </PopoverButton>
    </View>
  );
};
