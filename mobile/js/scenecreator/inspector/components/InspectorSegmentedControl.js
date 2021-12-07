import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import * as Constants from '../../../Constants';

const styles = StyleSheet.create({
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 4,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    backgroundColor: '#fff',
    ...Constants.styles.dropShadow,
    marginBottom: 8,
  },
  segmentedControlItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    fontSize: 16,
    flex: 1,
  },
  segmentedControlItemSelected: {
    backgroundColor: Constants.colors.black,
  },
  segmentedControlLabelSelected: {
    color: Constants.colors.white,
  },
});

export const InspectorSegmentedControl = ({ items, onChange, selectedItemIndex, style }) => (
  <View style={[styles.segmentedControl, style]}>
    {items.map((item, ii) => (
      <TouchableOpacity
        key={`item-${ii}`}
        onPress={() => onChange(ii)}
        style={[
          styles.segmentedControlItem,
          ii === selectedItemIndex ? styles.segmentedControlItemSelected : null,
        ]}>
        <Text
          style={[
            styles.segmentedControlItem,
            ii === selectedItemIndex ? styles.segmentedControlLabelSelected : null,
          ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);
