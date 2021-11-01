import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { InspectorNumberInput } from './inspector/components/InspectorNumberInput';
import { InspectorTextInput } from './inspector/components/InspectorTextInput';
import { useCoreState, sendAsync } from '../core/CoreEvents';

import FeatherIcon from 'react-native-vector-icons/Feather';

import 'react-native-get-random-values'; // required for uuid
import { v4 as uuidv4 } from 'uuid';

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
    marginRight: 16,
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

const validateVariableName = (name) => name.replace(/\s/g, '');

const VariableInput = ({ name, type, autoFocus, onChange, onDelete, ...props }) => {
  const nameInputProps = {
    ...props,
    autoFocus,
    value: name,
  };
  const valueInputProps = {
    ...props,
    value: props.initialValue,
  };
  return (
    <View style={styles.variableInputContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', width: '50%' }}>
        <Text style={styles.variablePrefix}>$</Text>
        <InspectorTextInput
          optimistic
          style={[styles.input, styles.variableName]}
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCompleteType="off"
          autoCorrect={false}
          onChangeText={(name) => onChange({ name: validateVariableName(name) })}
          {...nameInputProps}
        />
      </View>
      <InspectorNumberInput
        style={[styles.input, { width: '50%', paddingRight: 28 }]}
        placeholderTextColor="#666"
        autoCompleteType="off"
        autoCorrect={false}
        hideIncrements
        onChange={(value) => onChange({ initialValue: value })}
        {...valueInputProps}
      />
      <View style={{ width: 20, position: 'absolute', right: 0 }}>
        <TouchableOpacity onPress={onDelete}>
          <Constants.CastleIcon name="trash" size={22} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const DeckVariables = () => {
  const { showActionSheetWithOptions } = useActionSheet();
  const variables = useCoreState('EDITOR_VARIABLES')?.variables;

  const onChangeVariable = React.useCallback(
    (changes, index) => {
      const variable = variables[index];
      sendAsync('EDITOR_CHANGE_VARIABLES', {
        action: 'update',
        ...variable,
        ...changes,
      });
    },
    [variables, sendAsync]
  );
  const addVariable = React.useCallback(
    () =>
      sendAsync('EDITOR_CHANGE_VARIABLES', {
        action: 'add',
        ...SceneCreatorConstants.EMPTY_VARIABLE,
        variableId: uuidv4(),
      }),
    [sendAsync]
  );
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
            sendAsync('EDITOR_CHANGE_VARIABLES', {
              action: 'remove',
              variableId: variables[index].variableId,
            });
          }
        }
      ),
    [variables]
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
      <View style={{ flexDirection: 'column-reverse' }}>
        {variables &&
          variables.map((variable, ii) => (
            <VariableInput
              key={`var-${ii}-${variable.variableId}`}
              autoFocus={ii === 0 && variable.name.length === 0}
              onChange={(changes) => onChangeVariable(changes, ii)}
              onDelete={() => deleteVariable(ii)}
              {...variable}
            />
          ))}
      </View>
      <View style={styles.explainer}>
        <FeatherIcon name="book-open" size={18} color="#888" style={styles.explainerIcon} />
        <Text style={styles.explainerText}>
          Variables are shared between all cards in the same deck.
        </Text>
      </View>
      <View style={styles.explainer}>
        <FeatherIcon name="book-open" size={18} color="#888" style={styles.explainerIcon} />
        <Text style={styles.explainerText}>
          You can display the current value of a variable by writing{' '}
          <Text style={{ fontFamily: 'Menlo' }}>$variableName</Text> in a text box.
        </Text>
      </View>
    </View>
  );
};
