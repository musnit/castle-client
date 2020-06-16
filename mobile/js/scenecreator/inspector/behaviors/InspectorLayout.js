import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorNumberInput } from '../components/InspectorNumberInput';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 16,
  },
  properties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  inputContainer: {
    width: '50%',
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

const LayoutInput = ({ body, propName, label, sendAction }) => {
  const [value, sendValue] = useOptimisticBehaviorValue({
    behavior: body,
    propName,
    sendAction,
  });

  const onChange = React.useCallback(
    (value) => {
      if (body.isActive) {
        sendValue(`set:${propName}`, value);
      }
    },
    [body.isActive, sendValue]
  );

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <InspectorNumberInput
        value={value}
        onChange={onChange}
        {...body.propertySpecs[propName].props}
      />
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
