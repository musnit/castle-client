import * as React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useCoreState, sendBehaviorAction, sendAsync } from '../../../core/CoreEvents';
import { InspectorNumberInput } from '../components/InspectorNumberInput';
import { InspectorTextInput } from '../components/InspectorTextInput';
import { InspectorDropdown } from '../components/InspectorDropdown';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';
import * as Constants from '../../../Constants';

const styles = StyleSheet.create({
  container: {
    ...SceneCreatorConstants.styles.behaviorContainer,
    padding: 16,
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
  variableName: {
    fontWeight: '700',
    marginRight: 8,
  },
  input: {
    color: '#000',
    fontSize: 16,
    lineHeight: 20,
  },
});

const validateVariableName = (name) => name.replace(/\s/g, '');

export default InspectorLocalVariables = ({}) => {
  let component = useCoreState('EDITOR_SELECTED_COMPONENT:LocalVariables');
  if (!component) {
    component = { props: { localVariables: [] } };
  }
  const localVariables = component.props.localVariables;
  const sendAction = React.useCallback(
    (...args) => sendBehaviorAction('LocalVariables', ...args),
    [sendBehaviorAction]
  );

  const addVariable = React.useCallback(() => {
    sendAsync('EDITOR_CHANGE_LOCAL_VARIABLES', {
      localVariables, // TODO: Add variable
    });
  }, []);

  const changeVariableName = React.useCallback((i, newName) => {
    const newLocalVariables = [...localVariables];
    newLocalVariables[i].name = validateVariableName(newName),
    sendAsync('EDITOR_CHANGE_LOCAL_VARIABLES', {
      localVariables: newLocalVariables,
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={addVariable}>
          <Text style={styles.buttonLabel}>Add new variable</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { width: '50%' }]}>Name</Text>
        <Text style={[styles.label, { width: '50%' }]}>Initial Value</Text>
      </View>
      <View style={{ flexDirection: 'column' }}>
        {localVariables.map((localVariable, i) => (
          <View style={styles.variableInputContainer}>
            <View style={{ width: '47.5%', flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.variablePrefix}>$</Text>
              <InspectorTextInput
                value={localVariable.name}
                optimistic
                style={[styles.input, styles.variableName, { flexGrow: 1 }]}
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCompleteType="off"
                autoCorrect={false}
                onChangeText={(text) => changeVariableName(i, text)}
              />
            </View>
            <InspectorNumberInput
              value={localVariable.value}
              style={[styles.input, { width: '47.5%', paddingRight: 8 }]}
              placeholderTextColor="#666"
              autoCompleteType="off"
              autoCorrect={false}
              hideIncrements
              onChange={() => { /* TODO: Change variable initial value */ }}
            />
            <View style={{ width: 20 }}>
              <TouchableOpacity onPress={() => { /* TODO: Delete variable */ }}>
                <Constants.CastleIcon name="trash" size={22} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 16 }}/>
      <Text>{JSON.stringify(component.props, null, 2)}</Text>
    </View>
  );
};
