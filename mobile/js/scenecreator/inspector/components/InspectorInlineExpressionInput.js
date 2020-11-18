import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { InspectorNumberInput } from './InspectorNumberInput';
import { makeExpressionSummary } from '../../SceneCreatorUtilities';

import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: 28,
    aspectRatio: 1,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderRadius: 100,
  },
});

/**
 *  A compact expression editor which only allows editing primitive numbers, otherwise
 *  shows a summary and a button to open a richer expression editor.
 */
export const InspectorInlineExpressionInput = ({
  value,
  onChange,
  onConfigureExpression,
  ...props
}) => {
  let input;
  if (!value.expressionType) {
    // primitive number
    input = <InspectorNumberInput value={value} onChange={onChange} {...props} />;
  } else if (value.expressionType === 'number') {
    const onChangeValue = (newValue) =>
      onChange({
        ...value,
        params: {
          ...value.params,
          value: newValue,
        },
      });
    input = <InspectorNumberInput value={value.params.value} onChange={onChangeValue} {...props} />;
  } else {
    // no inline edit, just preview
    input = <Text>{makeExpressionSummary(value, props.context)}</Text>;
  }
  return (
    <View style={styles.container}>
      <View style={{ flexShrink: 1 }}>{input}</View>
      <TouchableOpacity
        style={styles.button}
        onPress={onConfigureExpression}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <MCIcon name="lock-pattern" size={14} color="#000" />
      </TouchableOpacity>
    </View>
  );
};
