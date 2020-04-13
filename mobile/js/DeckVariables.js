import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: '#666',
    paddingHorizontal: 16,
  },
  headingLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    width: '100%',
    textAlign: 'center',
    paddingVertical: 16,
  },
  variableInputContainer: {
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#888',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  variablePrefix: {
    color: '#666',
    fontSize: 18,
    fontWeight: '700',
    paddingRight: 4,
  },
  variableType: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  variableName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    width: '33%',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
    color: '#888',
  },
});

const DUMMY_VARIABLES = [
  {
    name: 'score',
    type: 'number',
    value: 5,
  },
  {
    name: 'health',
    type: 'number',
    value: 100,
  },
  {
    name: 'money',
    type: 'number',
    value: 475,
  },
];

const VariableInput = ({ name, type, ...props }) => {
  const textInputProps = {
    ...props,
    value: props.value?.toString(),
  };
  return (
    <View style={styles.variableInputContainer}>
      <View style={{ flexDirection: 'row', width: '33%' }}>
        <Text style={styles.variablePrefix}>$</Text>
        <Text style={styles.variableName}>{name}</Text>
      </View>
      <Text style={[styles.variableType, { width: '33%' }]}>{type}</Text>
      <TextInput
        style={[styles.input, { width: '33%' }]}
        placeholderTextColor="#666"
        {...textInputProps}
      />
    </View>
  );
};

const DeckVariables = () => (
  <View style={styles.container}>
    <Text style={styles.headingLabel}>Variables</Text>
    <View style={styles.labels}>
      <Text style={[styles.label, { textAlign: 'left' }]}>Name</Text>
      <Text style={[styles.label, { textAlign: 'center' }]}>Type</Text>
      <Text style={[styles.label, { textAlign: 'right' }]}>Initial Value</Text>
    </View>
    {DUMMY_VARIABLES.map((variable, ii) => (
      <VariableInput key={ii} {...variable} />
    ))}
  </View>
);

export default DeckVariables;
