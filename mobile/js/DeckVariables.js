import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import * as Constants from './Constants';

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
  actions: {
    alignItems: 'center',
    marginBottom: 8,
  },
  button: {
    ...Constants.styles.plainButton,
  },
  buttonLabel: {
    paddingHorizontal: 8,
    ...Constants.styles.plainButtonLabel,
  },
});

const VariableInput = ({ name, type, onChange, ...props }) => {
  const nameInputProps = {
    ...props,
    value: name,
  };
  const valueInputProps = {
    ...props,
    value: props.value?.toString(),
  };
  return (
    <View style={styles.variableInputContainer}>
      <View style={{ flexDirection: 'row', width: '33%' }}>
        <Text style={styles.variablePrefix}>$</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCompleteType="off"
          autoCorrect={false}
          onChangeText={(name) => onChange({ name })}
          {...nameInputProps}
        />
      </View>
      <Text style={[styles.variableType, { width: '33%' }]}>{type}</Text>
      <TextInput
        style={[styles.input, { width: '33%' }]}
        placeholderTextColor="#666"
        autoCompleteType="off"
        autoCorrect={false}
        keyboardType="number-pad"
        onChangeText={(value) => onChange({ value })}
        {...valueInputProps}
      />
    </View>
  );
};

const DeckVariables = ({ card, onChange }) => {
  const onChangeVariable = (changes, index) =>
    onChange({
      variables: card.variables.map((variable, ii) =>
        ii == index ? { ...variable, ...changes } : variable
      ),
    });
  return (
    <View style={styles.container}>
      <Text style={styles.headingLabel}>Variables</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonLabel}>Add new variable</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { textAlign: 'left' }]}>Name</Text>
        <Text style={[styles.label, { textAlign: 'center' }]}>Type</Text>
        <Text style={[styles.label, { textAlign: 'right' }]}>Initial Value</Text>
      </View>
      {card.variables &&
        card.variables.map((variable, ii) => (
          <VariableInput
            key={ii}
            onChange={(changes) => onChangeVariable(changes, ii)}
            {...variable}
          />
        ))}
    </View>
  );
};

export default DeckVariables;
