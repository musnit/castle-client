import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PopoverButton } from '../../../components/PopoverProvider';
import { DropdownItemsList } from './InspectorDropdown';
import { formatVariableName } from '../../SceneCreatorUtilities';
import { sendAsync, useCoreState } from '../../../core/CoreEvents';

import uuid from 'uuid/v4';

import * as Constants from '../../../Constants';
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
    borderColor: '#000',
    borderRadius: 4,
    padding: 8,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...Constants.styles.dropShadow,
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
  const variables = useCoreState('EDITOR_VARIABLES')?.variables;
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
        const newVariableId = uuid();
        sendAsync('EDITOR_CHANGE_VARIABLES', {
          action: 'add',
          ...SceneCreatorConstants.EMPTY_VARIABLE,
          name,
          variableId: newVariableId,
        });
        onChange(newVariableId);
      }
    },
    [items, onChange, sendAsync]
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
