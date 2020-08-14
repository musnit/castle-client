import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import FeatherIcon from 'react-native-vector-icons/Feather';
import uuid from 'uuid/v4';

import * as SceneCreatorConstants from './SceneCreatorConstants';
import * as Constants from '../Constants';

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  variableInputContainer: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: Constants.iOS ? 12 : 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  variablePrefix: {
    color: '#888',
    fontSize: 16,
    lineHeight: 20,
    paddingRight: 4,
    flexGrow: 0,
  },
  variableType: {
    color: '#bbb',
    fontSize: 16,
    lineHeight: 20,
  },
  variableName: {
    flexGrow: 1,
    fontWeight: '700',
  },
  input: {
    color: '#000',
    fontSize: 16,
    lineHeight: 20,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderColor: '#ccc',
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
    marginBottom: 16,
  },
  button: {
    ...SceneCreatorConstants.styles.button,
  },
  buttonLabel: {
    ...SceneCreatorConstants.styles.buttonLabel,
  },
  explainer: {
    paddingTop: 16,
    flexDirection: 'row',
  },
  explainerIcon: {
    marginTop: 4,
    marginRight: 12,
  },
  explainerText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#888',
  },
});

const EMPTY_VARIABLE = {
  id: 0,
  name: '',
  type: 'number',
  initialValue: 0,
  value: 0,
};

const maybeParseInt = (value) => {
  const result = parseInt(value);
  return isNaN(result) ? 0 : result;
};

const VariableInput = ({ name, type, autoFocus, onChange, onDelete, ...props }) => {
  const nameInputProps = {
    ...props,
    autoFocus,
    value: name,
  };
  const valueInputProps = {
    ...props,
    value: props.initialValue?.toString(),
  };
  return (
    <View style={styles.variableInputContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', width: '50%' }}>
        <Text style={styles.variablePrefix}>$</Text>
        <TextInput
          style={[styles.input, styles.variableName]}
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCompleteType="off"
          autoCorrect={false}
          onChangeText={(name) => onChange({ name })}
          {...nameInputProps}
        />
      </View>
      {/* <Text style={[styles.variableType, { width: '32%' }]}>{type}</Text> */}
      <TextInput
        style={[styles.input, { width: '50%' }]}
        placeholderTextColor="#666"
        autoCompleteType="off"
        autoCorrect={false}
        keyboardType="number-pad"
        onChangeText={(value) => onChange({ initialValue: maybeParseInt(value) })}
        {...valueInputProps}
      />
      <View style={{ width: 20, marginLeft: -20 }}>
        <TouchableOpacity onPress={onDelete}>
          <FeatherIcon name="trash-2" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const DeckVariables = ({ variables, onChange }) => {
  const { showActionSheetWithOptions } = useActionSheet();

  const onChangeVariable = React.useCallback(
    (changes, index) =>
      onChange(
        variables.map((variable, ii) => (ii == index ? { ...variable, ...changes } : variable))
      ),
    [variables, onChange]
  );
  const addVariable = React.useCallback(() => {
    const existing = variables && variables.length ? variables : [];
    return onChange([{ ...EMPTY_VARIABLE, id: uuid() }].concat(existing));
  }, [variables, onChange]);
  const deleteVariable = React.useCallback(
    (index) =>
      showActionSheetWithOptions(
        {
          title: `Delete variable "${variables[index].name}"?`,
          options: ['Delete', 'Cancel'],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            onChange(variables.filter((variable, ii) => ii !== index));
          }
        }
      ),
    [variables, onChange]
  );

  return (
    <View style={styles.content}>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={addVariable}>
          <Text style={styles.buttonLabel}>Add new variable</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { width: '50%' }]}>Name</Text>
        <Text style={[styles.label, { width: '50%' }]}>Initial Value</Text>
      </View>
      {variables &&
        variables.map((variable, ii) => (
          <VariableInput
            key={`var-${ii}-${variable.id}`}
            autoFocus={ii === 0 && variable.name.length === 0}
            onChange={(changes) => onChangeVariable(changes, ii)}
            onDelete={() => deleteVariable(ii)}
            {...variable}
          />
        ))}
      <View style={styles.explainer}>
        <FeatherIcon name="book-open" size={18} color="#888" style={styles.explainerIcon} />
        <Text style={styles.explainerText}>Variables can only be integer numbers.</Text>
      </View>
      <View style={styles.explainer}>
        <FeatherIcon name="book-open" size={18} color="#888" style={styles.explainerIcon} />
        <Text style={styles.explainerText}>
          Variables are shared between all cards in the same deck.
        </Text>
      </View>
    </View>
  );
};
