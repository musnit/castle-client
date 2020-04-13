import React, { Fragment } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from './Constants';

import ConfigureInput from './ConfigureInput';
import SegmentedNavigation from './SegmentedNavigation';

const styles = StyleSheet.create({
  container: {
    zIndex: 1, // we use negative margin to place the scene behind the header
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabsContainer: {
    width: '100%',
    height: '100%',
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: -54, // required to center properly with back button
    zIndex: -1, // required to prevent negative margin from blocking back button
  },
});

const MODE_ITEMS = [
  {
    name: 'Card',
    value: 'card',
  },
  {
    name: 'Variables',
    value: 'variables',
  },
];

const CardHeader = ({ card, isEditable, onPressBack, mode, onChangeMode }) => {
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <TouchableOpacity style={styles.back} onPress={onPressBack}>
        <Icon name="close" size={32} color="#fff" style={Constants.styles.textShadow} />
      </TouchableOpacity>
      <View style={styles.tabsContainer}>
        <SegmentedNavigation
          items={MODE_ITEMS}
          selectedItem={MODE_ITEMS.find((item) => item.value === mode)}
          onSelectItem={(item) => onChangeMode(item.value)}
        />
      </View>
    </View>
  );
};

export default CardHeader;
