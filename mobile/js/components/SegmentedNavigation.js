import React from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import * as Constants from '../Constants';

const darkBackgroundStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  label: {
    paddingBottom: 6,
    borderColor: 'transparent',
    borderBottomWidth: 3,
    // backgroundColor: '#777',
  },
  selectedLabel: {
    borderColor: '#fff',
  },
  name: {
    fontSize: 14,
    color: Constants.colors.halfWhite,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedName: {
    color: Constants.colors.white,
    fontWeight: 'bold',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: Constants.colors.white,
    position: 'absolute',
    right: -8,
    top: -1,
  },
});

const lightBackgroundStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  indicator: {
    width: 9,
    height: 9,
    backgroundColor: Constants.colors.black,
    borderRadius: 5,
    position: 'absolute',
    right: 2,
    top: 7,
  },
});

export const SegmentedNavigation = (props) => {
  const { items, selectedItem, onSelectItem, isLightBackground } = props;
  const styles = isLightBackground ? lightBackgroundStyles : darkBackgroundStyles;

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <Pressable
          key={item.value}
          style={[styles.item, item === selectedItem ? styles.selectedItem : null]}
          onPress={() => onSelectItem(item)}>
          <View style={[styles.label, item === selectedItem ? styles.selectedLabel : null]}>
            {item.icon ? (
              <MCIcon name={item.icon} size={24} color={item === selectedItem ? '#fff' : '#ccc'} />
            ) : (
              <Text style={[styles.name, item === selectedItem ? styles.selectedName : null]}>
                {item.name}
              </Text>
            )}
            {item.indicator ? <View style={styles.indicator} /> : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
};
