import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import * as Constants from '../Constants';

const darkBackgroundStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedItem: {
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderColor: Constants.colors.white,
  },
  name: {
    fontSize: 16,
    color: Constants.colors.grayText,
  },
  selectedName: {
    color: Constants.colors.white,
    fontWeight: 'bold',
  },
});

const lightBackgroundStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedItem: {
    paddingBottom: 5,
    borderBottomWidth: 3,
    borderColor: Constants.colors.black,
  },
  name: {
    fontSize: 16,
    color: Constants.colors.grayText,
  },
  selectedName: {
    color: Constants.colors.black,
    fontWeight: 'bold',
  },
});

export const SegmentedNavigation = (props) => {
  const { items, selectedItem, onSelectItem, isLightBackground } = props;
  const styles = isLightBackground ? lightBackgroundStyles : darkBackgroundStyles;

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.value}
          style={[styles.item, item === selectedItem ? styles.selectedItem : null]}
          onPress={() => onSelectItem(item)}>
          {item.icon ? (
            <MCIcon name={item.icon} size={24} color={item === selectedItem ? '#fff' : '#ccc'} />
          ) : (
            <Text style={[styles.name, item === selectedItem ? styles.selectedName : null]}>
              {item.name}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};
