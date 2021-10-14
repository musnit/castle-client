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
    paddingTop: 4,
  },
  label: {
    paddingBottom: 6,
    borderColor: 'transparent',
    borderBottomWidth: 3,
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
    width: 9,
    height: 9,
    borderRadius: 9,
    backgroundColor: Constants.colors.white,
    position: 'absolute',
    right: -10,
    top: -2,
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
    paddingTop: 4,
  },
  label: {
    paddingBottom: 6,
    borderColor: 'transparent',
    borderBottomWidth: 3,
  },
  selectedLabel: {
    borderColor: '#000',
  },
  name: {
    fontSize: 14,
    color: Constants.colors.grayOnWhiteText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedName: {
    color: Constants.colors.black,
    fontWeight: 'bold',
  },
  indicator: {
    width: 9,
    height: 9,
    borderRadius: 9,
    backgroundColor: Constants.colors.black,
    position: 'absolute',
    right: -10,
    top: -2,
  },
});

export const SegmentedNavigation = (props) => {
  const { items, selectedItem, onSelectItem, isLightBackground, compact } = props;
  const styles = isLightBackground ? lightBackgroundStyles : darkBackgroundStyles;

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <Pressable
          key={item.value}
          style={[
            styles.item,
            { paddingHorizontal: compact ? 8 : 12 },
            item === selectedItem ? styles.selectedItem : null,
          ]}
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
