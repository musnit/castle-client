import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AntIcon from 'react-native-vector-icons/AntDesign';
import Ionicon from 'react-native-vector-icons/Ionicons';
import { useActionSheet } from '@expo/react-native-action-sheet';

import * as Constants from './Constants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    marginBottom: 4,
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
  addLabel: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  deleteButton: { alignItems: 'center', justifyContent: 'center', padding: 4 },
});

const EMPTY_CONDITION = {
  variableId: '0',
  operator: 'equals',
  operand: 0,
};

const OPERATORS = ['equals', 'does not equal', 'is less than', 'is greater than'];

const DropdownCaret = () => (
  <AntIcon name="caretdown" size={12} color="#fff" style={styles.caret} />
);

const BlockPreconditionPickerControl = ({ variables, block, onChangeBlock }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const condition = block.metadata?.condition;
  const onChangeCondition = React.useCallback(
    (changes) =>
      onChangeBlock({
        ...block,
        metadata: {
          ...block.metadata,
          condition: {
            ...condition,
            ...changes,
          },
        },
      }),
    [condition, onChangeBlock]
  );
  const onDeleteCondition = React.useCallback(
    () =>
      onChangeBlock({
        ...block,
        metadata: {
          ...block.metadata,
          condition: undefined,
        },
      }),
    [onChangeCondition]
  );
  const onChangeOperand = React.useCallback(
    (textValue) => {
      let val = parseInt(textValue);
      val = isNaN(val) ? 0 : val;
      return onChangeCondition({
        operand: val,
      });
    },
    [condition, onChangeCondition]
  );
  const onChangeVariable = React.useCallback(() => {
    if (variables) {
      showActionSheetWithOptions(
        {
          title: 'Choose a variable',
          options: variables.map((variable) => variable.name).concat(['Cancel']),
          cancelButtonIndex: variables.length,
        },
        async (buttonIndex) => {
          if (buttonIndex !== variables.length) {
            onChangeCondition({ variableId: variables[buttonIndex].id });
          }
        }
      );
    }
  }, [variables, onChangeCondition]);
  const onChangeOperator = React.useCallback(
    () =>
      showActionSheetWithOptions(
        {
          title: 'Choose how to compare the variable',
          options: OPERATORS.concat(['Cancel']),
          cancelButtonIndex: OPERATORS.length,
        },
        async (buttonIndex) => {
          if (buttonIndex !== OPERATORS.length) {
            onChangeCondition({ operator: OPERATORS[buttonIndex] });
          }
        }
      ),
    [onChangeCondition]
  );
  const referencedVar =
    condition && variables ? variables.find((v) => v.id === condition.variableId) : null;
  if (condition && referencedVar) {
    return (
      <View style={styles.container}>
        <View style={styles.conditionCell}>
          <Text style={styles.componentLabel}>If</Text>
        </View>
        <TouchableOpacity style={styles.componentCell} onPress={onChangeVariable}>
          <Text style={styles.variablePrefix}>$</Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.componentLabel}>
            {referencedVar.name}
          </Text>
          <DropdownCaret />
        </TouchableOpacity>
        <TouchableOpacity style={styles.componentCell} onPress={onChangeOperator}>
          <Text style={styles.componentLabel}>{condition.operator}</Text>
          <DropdownCaret />
        </TouchableOpacity>
        <View style={styles.componentCell}>
          <TextInput
            style={styles.componentLabel}
            value={condition.operand?.toString()}
            autoCompleteType="off"
            autoCorrect={false}
            keyboardType="number-pad"
            onChangeText={onChangeOperand}
          />
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={onDeleteCondition}>
          <Ionicon name="md-trash" size={24} color="#bbb" />
        </TouchableOpacity>
      </View>
    );
  } else if (variables?.length) {
    const variableId = variables[0].id;
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.componentCell}
          onPress={() => onChangeCondition({ ...EMPTY_CONDITION, variableId })}>
          <Ionicon name="md-add" size={18} color="#fff" style={{ marginRight: 4, marginTop: 1 }} />
          <Text style={styles.addLabel}>Add requirement</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    return null;
  }
};

export default BlockPreconditionPickerControl;
