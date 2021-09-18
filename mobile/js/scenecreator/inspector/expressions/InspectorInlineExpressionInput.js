import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getRuleRenderContext } from '../rules/RuleRenderContext';
import { InspectorNumberInput } from '../components/InspectorNumberInput';
import { makeExpressionSummary } from '../../SceneCreatorUtilities';

import FastImage from 'react-native-fast-image';

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
    marginRight: 6,
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
  let propsWithoutStyle = { ...props, style: undefined };
  if (!value?.expressionType) {
    // primitive number
    input = <InspectorNumberInput value={value} onChange={onChange} {...propsWithoutStyle} />;
  } else if (value.expressionType === 'number') {
    const onChangeValue = (newValue) =>
      onChange({
        ...value,
        params: {
          ...value.params,
          value: newValue,
        },
      });
    input = (
      <InspectorNumberInput
        value={value.params.value}
        onChange={onChangeValue}
        {...propsWithoutStyle}
      />
    );
  } else {
    // no inline edit, just preview
    input = <Text>{makeExpressionSummary(value, getRuleRenderContext())}</Text>;
  }
  return (
    <View style={[styles.container, props.style]}>
      <TouchableOpacity
        style={styles.button}
        onPress={onConfigureExpression}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <FastImage
          style={{
            width: 16,
            height: 16,
          }}
          source={require('../../../../assets/images/expression.png')}
        />
      </TouchableOpacity>
      <View style={{ flexShrink: 1 }}>{input}</View>
    </View>
  );
};
