import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { InspectorTextInput } from './InspectorTextInput';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import * as Constants from '../../../Constants';

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
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderRadius: 100,
    backgroundColor: '#fff',
    ...Constants.styles.dropShadow,
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
  const [text, setText] = React.useState(numberToText(value, props.decimalDigits));

  const validate = React.useCallback(
    (value) => {
      let result = value;
      if (props) {
        if (props.min !== null && value < props.min) {
          result = props.min;
        }
        if (props.max !== null && value > props.max) {
          result = props.max;
        }
      }
      return result;
    },
    [props]
  );

  // if the initial value doesn't validate, update once when mounted
  React.useEffect(() => {
    const validatedInitialValue = validate(value);
    if (validatedInitialValue !== value) {
      setText(numberToText(validatedInitialValue, props.decimalDigits));
      onChange(validatedInitialValue);
    }
  }, []);

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
    setText(numberToText(newValue, props.decimalDigits));
    onChange(newValue);
  }, [value, step, onChange]);
  const onPlus = React.useCallback(() => {
    const newValue = validate(value + step);
    setText(numberToText(newValue, props.decimalDigits));
    onChange(newValue);
  }, [value, step, onChange]);

  // refresh displayed text if we got a new value from lua
  React.useEffect(() => setText(numberToText(value, props.decimalDigits)), [lastNativeUpdate]);

  // keyboard: numbers-and-punctuation is needed on iOS because the other options lack
  // a minus sign
  return (
    <View style={[styles.container, props.style]}>
      <InspectorTextInput
        style={styles.input}
        value={text}
        onChangeText={onChangeText}
        keyboardType={Constants.iOS ? 'numbers-and-punctuation' : 'decimal-pad'}
      />
      {!props.hideIncrements ? (
        <React.Fragment>
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
        </React.Fragment>
      ) : null}
    </View>
  );
};
