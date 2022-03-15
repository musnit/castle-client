import * as React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
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
    component = { props: { localVariables: [], undoRedoCount: 0 } };
  }
  const localVariables = component.props.localVariables;
  const undoRedoCount = component.props.undoRedoCount;

  const addVariable = React.useCallback(() => {
    sendAsync('EDITOR_CHANGE_LOCAL_VARIABLES', {
      commandDescription: 'add local variable',
      localVariables: [{ name: '', value: 0 }, ...localVariables],
    });
  }, [localVariables]);

  const changeVariableName = React.useCallback(
    (i, newName) => {
      const newLocalVariables = [...localVariables];
      newLocalVariables[i] = {
        ...newLocalVariables[i],
        name: validateVariableName(newName),
      };
      sendAsync('EDITOR_CHANGE_LOCAL_VARIABLES', {
        commandDescription: 'change local variable name',
        localVariables: newLocalVariables,
      });
    },
    [localVariables]
  );

  const changeVariableValue = React.useCallback(
    (i, newValue) => {
      const newLocalVariables = [...localVariables];
      newLocalVariables[i] = {
        ...newLocalVariables[i],
        value: newValue,
      };
      sendAsync('EDITOR_CHANGE_LOCAL_VARIABLES', {
        commandDescription: 'change local variable value',
        localVariables: newLocalVariables,
      });
    },
    [localVariables]
  );

  const deleteVariable = React.useCallback(
    (i) => {
      const newLocalVariables = [...localVariables];
      newLocalVariables.splice(i, 1);
      sendAsync('EDITOR_CHANGE_LOCAL_VARIABLES', {
        commandDescription: 'remove local variable',
        localVariables: newLocalVariables,
      });
    },
    [localVariables]
  );

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
          <View
            key={`${undoRedoCount}-${localVariables.length}-${i}`}
            style={styles.variableInputContainer}>
            <View style={{ width: '47.5%', flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.variablePrefix}>$</Text>
              <InspectorTextInput
                value={localVariable.name}
                autoFocus={i == 0 && localVariable.name === ''}
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
              onChange={(value) => changeVariableValue(i, value)}
            />
            <View style={{ width: 20 }}>
              <TouchableOpacity onPress={() => deleteVariable(i)}>
                <Constants.CastleIcon name="trash" size={22} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 16 }} />
      <Text>{JSON.stringify(component.props, null, 2)}</Text>
    </View>
  );
};
