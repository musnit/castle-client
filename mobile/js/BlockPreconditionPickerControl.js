import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AntIcon from 'react-native-vector-icons/AntDesign';

import * as Constants from './Constants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 12,
  },
  conditionCell: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    marginRight: 8,
  },
  componentCell: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  variablePrefix: {
    color: '#666',
    fontSize: 18,
    fontWeight: '700',
    paddingRight: 4,
  },
  componentLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
    minWidth: 24,
    maxWidth: 128,
  },
  caret: {
    ...Constants.styles.textShadow,
    paddingLeft: 6,
    paddingTop: 2,
  },
});

const DropdownCaret = () => (
  <AntIcon name="caretdown" size={12} color="#fff" style={styles.caret} />
);

const BlockPreconditionPickerControl = ({ deck, block }) => {
  return (
    <View style={styles.container}>
      <View style={styles.conditionCell}>
        <Text style={styles.componentLabel}>If</Text>
      </View>
      <View style={styles.componentCell}>
        <Text style={styles.variablePrefix}>$</Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.componentLabel}>
          score
        </Text>
        <DropdownCaret />
      </View>
      <View style={styles.componentCell}>
        <Text style={styles.componentLabel}>equals</Text>
        <DropdownCaret />
      </View>
      <View style={styles.componentCell}>
        <Text style={styles.componentLabel}>5</Text>
      </View>
    </View>
  );
};

export default BlockPreconditionPickerControl;
