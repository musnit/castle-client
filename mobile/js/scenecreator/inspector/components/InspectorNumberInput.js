import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { InspectorTextInput } from './InspectorTextInput';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    flexShrink: 1,
  },
  button: {
    width: 28,
    aspectRatio: 1,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 100,
  },
});

const textToNumber = (text) => {
  const parsed = parseFloat(text);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const numberToText = (number, decimalDigits = 3) => {
  if (typeof number !== 'number') {
    return '0';
  }
  return parseFloat(number.toFixed(decimalDigits)).toString();
};

export const InspectorNumberInput = ({ value, lastNativeUpdate, onChange, ...props }) => {
  // Maintain `text` separately from `value` to allow incomplete text such as '' or '3.'
  const [text, setText] = React.useState(numberToText(value));

  const validate = React.useCallback(
    (value) => {
      let result = value;
      if (props) {
        if (props.min !== undefined && value < props.min) {
          result = props.min;
        }
        if (props.max !== undefined && value > props.max) {
          result = props.max;
        }
      }
      return result;
    },
    [props]
  );

  const step = props?.step ?? 1;
  const onChangeText = React.useCallback(
    (text) => {
      setText(text);
      onChange(validate(textToNumber(text, props.decimalDigits)));
    },
    [onChange, setText]
  );
  const onMinus = React.useCallback(() => {
    const newValue = validate(value - step);
    setText(numberToText(newValue));
    onChange(newValue);
  }, [value, step, onChange]);
  const onPlus = React.useCallback(() => {
    const newValue = validate(value + step);
    setText(numberToText(newValue));
    onChange(newValue);
  }, [value, step, onChange]);

  // refresh displayed text if we got a new value from lua
  React.useEffect(() => setText(numberToText(value)), [lastNativeUpdate]);

  return (
    <View style={styles.container}>
      <InspectorTextInput style={styles.input} value={text} onChangeText={onChangeText} />
      <TouchableOpacity
        style={[styles.button, styles.minusButton]}
        onPress={onMinus}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <FontAwesome name="minus" size={14} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.plusButton]}
        onPress={onPlus}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <FontAwesome name="plus" size={14} color="#000" />
      </TouchableOpacity>
    </View>
  );
};
