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
  header: {
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
  },
  label: {
    width: '33%',
    fontSize: 14,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 8,
    color: '#888',
  },
  variableInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  variableInputColumn: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  variablePrefix: {
    color: '#888',
    fontSize: 16,
    lineHeight: 20,
    marginRight: 6,
  },
  variableName: {
    fontWeight: '700',
  },
  input: {
    color: '#000',
    fontSize: 16,
    lineHeight: 20,
    flexGrow: 1,
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
    <View style={[SceneCreatorConstants.styles.inspectorSection, { borderTopWidth: 1 }]}>
      <View style={SceneCreatorConstants.styles.inspectorSectionHeader}>
        <Text style={SceneCreatorConstants.styles.inspectorSectionHeaderLabel}>Variables</Text>
        <View style={SceneCreatorConstants.styles.inspectorSectionHeaderActions}>
          <TouchableOpacity
            style={SceneCreatorConstants.styles.inspectorSectionHeaderButton}
            onPress={addVariable}>
            <Constants.CastleIcon name="plus" size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
      {localVariables.length > 0 ? (
        <View style={styles.labels}>
          <Text style={[styles.label, { width: '50%' }]}>Name</Text>
          <Text style={[styles.label, { width: '50%' }]}>Initial Value</Text>
        </View>
      ) : null}
      <View style={{ flexDirection: 'column' }}>
        {localVariables.map((localVariable, i) => (
          <View
            key={`${undoRedoCount}-${localVariables.length}-${i}`}
            style={styles.variableInputContainer}>
            <View style={[styles.variableInputColumn, { paddingRight: 8 }]}>
              <Text style={styles.variablePrefix}>$</Text>
              <InspectorTextInput
                value={localVariable.name}
                autoFocus={i == 0 && localVariable.name === ''}
                optimistic
                style={[styles.input, styles.variableName]}
                placeholderTextColor="#888"
                autoCapitalize="none"
                autoCompleteType="off"
                autoCorrect={false}
                onChangeText={(text) => changeVariableName(i, text)}
              />
            </View>
            <View style={styles.variableInputColumn}>
              <InspectorNumberInput
                value={localVariable.value}
                style={{ flex: 1, marginRight: 8 }}
                placeholderTextColor="#888"
                autoCompleteType="off"
                autoCorrect={false}
                hideIncrements
                onChange={(value) => changeVariableValue(i, value)}
              />
              <TouchableOpacity onPress={() => deleteVariable(i)}>
                <Constants.CastleIcon name="trash" size={22} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};
