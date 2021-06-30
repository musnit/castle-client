import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PopoverButton } from '../../../components/PopoverProvider';
import { DropdownItemsList } from './InspectorDropdown';
import { formatVariableName } from '../../SceneCreatorUtilities';
import { useCoreState } from '../../../core/CoreEvents';

import uuid from 'uuid/v4';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  box: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    padding: 8,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activeBox: {
    borderBottomWidth: 1,
    marginBottom: 1,
    borderStyle: 'dashed',
  },
  label: {
    fontSize: 16,
  },
});

export const InspectorVariablePicker = ({ value, onChange, style, ...props }) => {
  // TODO: change variables
  const onVariablesChange = (newVariables) =>
    console.log(`change variables: ${JSON.stringify(newVariables, null, 2)}`);
  const variables = useCoreState('EDITOR_VARIABLES');
  const items = variables || [];

  let selectedItem;
  if (value && value !== 'none') {
    selectedItem = items.find((item) => item.variableId === value);
  }

  const addVariable = React.useCallback(
    (name) => {
      if (name) {
        name = name.replace(/\s/g, '');
        if (!name?.length) {
          return;
        }
        const existing = items?.length ? items : [];
        const newVariableId = uuid();
        onVariablesChange(
          [{ ...SceneCreatorConstants.EMPTY_VARIABLE, name, id: newVariableId }].concat(existing)
        );
        onChange(newVariableId);
      }
    },
    [items, onChange, onVariablesChange]
  );

  const popover = {
    Component: DropdownItemsList,
    items,
    selectedItem,
    height: 192,
    onSelectItem: (item) => onChange(item.variableId),
    showAddItem: true,
    onAddItem: addVariable,
  };

  let valueLabel = selectedItem ? formatVariableName(selectedItem.name) : '(none)';

  return (
    <View style={[styles.container, style]} {...props}>
      <PopoverButton
        style={styles.box}
        activeStyle={[styles.box, styles.activeBox]}
        popover={popover}>
        <Text>{valueLabel}</Text>
      </PopoverButton>
    </View>
  );
};
