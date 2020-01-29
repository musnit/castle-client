import React from 'react';
import { View, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';

import SegmentedNavigation from './SegmentedNavigation';

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderColor: '#888',
  },
  fixedHeader: {
    width: '100%',
    height: 54,
    position: 'absolute',
    top: 0,
    height: 54,
    flexDirection: 'row',
  },
  back: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginTop: 54,
    padding: 8,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 32,
  },
});

const MODE_ITEMS = [
  {
    name: 'Cards',
    value: 'cards',
  },
  {
    name: 'Settings',
    value: 'settings',
  },
];

const DeckHeader = (props) => {
  const { deck } = props;
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.fixedHeader}>
        <TouchableOpacity style={styles.back} onPress={props.onPressBack}>
          <FastImage
            style={{
              width: 22,
              aspectRatio: 1,
            }}
            source={require('../assets/images/arrow-left.png')}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Text style={styles.title}>{deck && deck.title}</Text>
      </View>
      <SegmentedNavigation
        items={MODE_ITEMS}
        selectedItem={MODE_ITEMS.find((item) => item.value === props.mode)}
        onSelectItem={(item) => props.onChangeMode(item.value)}
      />
    </View>
  );
};

export default DeckHeader;
