import React from 'react';
import { View, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SegmentedNavigation } from '../components/SegmentedNavigation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderColor: Constants.colors.grayOnBlackBorder,
  },
  navigationRow: {
    width: '100%',
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
    padding: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  instructionsLabel: {
    color: '#fff',
    marginBottom: 16,
    fontSize: 16,
    lineHeight: 24,
  },
});

const MODE_ITEMS = [
  {
    name: 'Cards',
    value: 'cards',
  },
];

export const ViewSourceDeckHeader = (props) => {
  const { deck } = props;
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navigationRow}>
        <TouchableOpacity style={styles.back} onPress={props.onPressBack}>
          <Icon name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
      {deck ? (
        <View style={styles.header}>
          <Text style={styles.instructionsLabel}>
            <Text style={{ fontWeight: 'bold' }}>@{deck.creator?.username}</Text>'s deck
          </Text>
        </View>
      ) : null}
      <SegmentedNavigation
        items={MODE_ITEMS}
        selectedItem={MODE_ITEMS[0]}
        onSelectItem={(item) => {}}
      />
    </View>
  );
};
