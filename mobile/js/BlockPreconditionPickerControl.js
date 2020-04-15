import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

const DUMMY_CONDITION = {
  variable: 'score',
  operator: 'equals',
  comparator: 5,
};

const DropdownCaret = () => (
  <AntIcon name="caretdown" size={12} color="#fff" style={styles.caret} />
);

const BlockPreconditionPickerControl = ({ deck, block, onChangeBlock }) => {
  const condition = block.condition || DUMMY_CONDITION;
  const onChangeComparator = React.useCallback(
    (textValue) => {
      let val = parseInt(textValue);
      val = isNaN(val) ? 0 : val;
      return onChangeBlock({
        ...block,
        condition: {
          ...condition,
          comparator: val,
        },
      });
    },
    [condition, onChangeBlock]
  );
  return (
    <View style={styles.container}>
      <View style={styles.conditionCell}>
        <Text style={styles.componentLabel}>If</Text>
      </View>
      <View style={styles.componentCell}>
        <Text style={styles.variablePrefix}>$</Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.componentLabel}>
          {condition.variable}
        </Text>
        <DropdownCaret />
      </View>
      <View style={styles.componentCell}>
        <Text style={styles.componentLabel}>{condition.operator}</Text>
        <DropdownCaret />
      </View>
      <View style={styles.componentCell}>
        <TextInput
          style={styles.componentLabel}
          value={condition.comparator?.toString()}
          autoCompleteType="off"
          autoCorrect={false}
          keyboardType="number-pad"
          onChangeText={onChangeComparator}
        />
      </View>
    </View>
  );
};

export default BlockPreconditionPickerControl;
