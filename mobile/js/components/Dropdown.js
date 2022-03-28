import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from './AppText';
import { PopoverButton } from './PopoverProvider';
import * as Constants from '../Constants';
const CastleIcon = Constants.CastleIcon;

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  box: {},
  activeBox: {},
  item: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 18,
    alignItems: 'center',
    marginTop: -1,
    marginRight: 11,
    marginLeft: -4,
  },
  itemText: {
    fontSize: 15,
    lineHeight: 20,
  },
  adminItemText: {
    color: '#999',
  },
  selectedItemText: {
    fontWeight: 'bold',
  },
});

export const DropdownItemsList = ({ items, selectedItem, onSelectItem, closePopover }) => {
  return (
    <View>
      {items &&
        items.map((item, ii) => (
          <TouchableOpacity
            key={`item-${ii}`}
            style={{ ...styles.item, borderBottomWidth: items[items.length - 1] == item ? 0 : 1 }}
            onPress={() => {
              onSelectItem(item);
              closePopover();
            }}>
            <View style={styles.itemIcon}>
              {item.icon ? (
                <Icon name={item.icon} size={20} color={item.admin ? '#999' : '#000'} />
              ) : null}
              {item.castleIcon ? (
                <CastleIcon name={item.castleIcon} size={20} color="#000" />
              ) : null}
            </View>
            <Text
              style={[
                styles.itemText,
                item === selectedItem ? styles.selectedItemText : null,
                item.admin ? styles.adminItemText : null,
              ]}>
              {item.name}
            </Text>
            <View style={styles.itemIcon}>
              {item === selectedItem ? <Icon name="check" size={20} color="#000" /> : null}
            </View>
          </TouchableOpacity>
        ))}
    </View>
  );
};

export const Dropdown = ({ value, onChange, style, children, ...props }) => {
  let items;
  if (props?.items) {
    items = props.items.map((item) => ({ id: item, name: item }));
  } else if (props?.labeledItems) {
    items = props.labeledItems;
  }
  let selectedItem;
  if (value && value !== 'none') {
    selectedItem = items.find((item) => item.id === value);
  }
  const popover = {
    Component: DropdownItemsList,
    items,
    selectedItem,
    height: 45 * items.length,
    width: 256,
    onSelectItem: (item) => onChange(item.id),
  };

  return (
    <View style={[styles.container, style]} {...props}>
      <PopoverButton
        style={styles.box}
        activeStyle={[styles.box, styles.activeBox]}
        popover={popover}>
        {children}
      </PopoverButton>
    </View>
  );
};
