import * as React from 'react';
import { StyleSheet, TextInput, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from './InspectorUtilities';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 8,
  },
  properties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  inputContainer: {
    width: '40%',
    paddingRight: 8,
    paddingBottom: 8,
  },
  inputLabel: {
    paddingBottom: 4,
  },
  input: {
    borderWidth: 1,
    color: '#000',
    borderColor: '#333',
    padding: 8,
  },
});

const textToNumber = (text) => {
  const parsed = parseFloat(text);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const numberToText = (number) => {
  if (typeof number !== 'number') {
    return '0';
  }
  return parseFloat(number.toFixed(3)).toString();
};

const LayoutInput = ({ body, propName, label, sendAction }) => {
  const [value, sendValue] = useOptimisticBehaviorValue({
    behavior: body,
    propName,
    sendAction,
  });

  const onChange = React.useCallback(
    (value) => {
      if (body.isActive) {
        sendValue(`set:${propName}`, textToNumber(value));
      }
    },
    [body.isActive, sendValue]
  );

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput style={styles.input} value={numberToText(value)} onChangeText={onChange} />
    </View>
  );
};

export default InspectorLayout = ({ body, sendAction }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Layout</Text>
      <View style={styles.properties}>
        <LayoutInput body={body} propName="width" label="Width" sendAction={sendAction} />
        <LayoutInput body={body} propName="height" label="Height" sendAction={sendAction} />
        <LayoutInput body={body} propName="x" label="X Position" sendAction={sendAction} />
        <LayoutInput body={body} propName="y" label="Y Position" sendAction={sendAction} />
        <LayoutInput body={body} propName="angle" label="Rotation" sendAction={sendAction} />
      </View>
    </View>
  );
};
