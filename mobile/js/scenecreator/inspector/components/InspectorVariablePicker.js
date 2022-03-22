import * as React from 'react';
import { AppText as Text } from '../../../components/AppText';
import { PopoverButton } from '../../../components/PopoverProvider';
import { StyleSheet, View } from 'react-native';
import { DropdownItemsList } from './InspectorDropdown';
import { formatVariableName } from '../../SceneCreatorUtilities';
import { InspectorSegmentedControl } from './InspectorSegmentedControl';
import { PopoverButton } from '../../../components/PopoverProvider';
import { sendAsync, useCoreState } from '../../../core/CoreEvents';

import 'react-native-get-random-values'; // required for uuid
import { v4 as uuidv4 } from 'uuid';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scopePicker: { width: '40%' },
});

const InspectorLocalVariablePicker = ({ value, onChange, style, ...props }) => {
  let component = useCoreState('EDITOR_SELECTED_COMPONENT:LocalVariables');
  if (!component) {
    component = { props: { localVariables: [], undoRedoCount: 0 } };
  }
  const localVariables = component.props.localVariables;
  const items = localVariables || [];

  let selectedItem;
  if (value && value !== 'none') {
    selectedItem = items.find((item) => item.name === value);
  }

  const addVariable = React.useCallback(
    (name) => {
      if (name) {
        onChange(name);
      }
    },
    [onChange]
  );

  const popover = {
    Component: DropdownItemsList,
    items,
    reverse: true,
    selectedItem,
    height: 192,
    onSelectItem: (item) => onChange(item.name),
    showAddItem: true,
    onAddItem: addVariable,
  };

  let valueLabel = selectedItem ? formatVariableName(selectedItem.name) : '(none)';

  return (
    <View {...props}>
      <PopoverButton
        style={styles.box}
        activeStyle={[styles.box, styles.activeBox]}
        popover={popover}>
        <Text style={styles.label}>{valueLabel}</Text>
      </PopoverButton>
    </View>
  );
};

const InspectorGlobalVariablePicker = ({ value, onChange, style, ...props }) => {
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
        const newVariableId = uuidv4();
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
    reverse: true,
    selectedItem,
    height: 192,
    onSelectItem: (item) => onChange(item.variableId),
    showAddItem: true,
    onAddItem: addVariable,
  };

  let valueLabel = selectedItem ? formatVariableName(selectedItem.name) : '(none)';

  return (
    <View {...props}>
      <PopoverButton
        style={styles.box}
        activeStyle={[styles.box, styles.activeBox]}
        popover={popover}>
        <Text style={styles.label}>{valueLabel}</Text>
      </PopoverButton>
    </View>
  );
};

const SCOPE_ITEMS = [
  {
    id: 'global',
    name: 'Deck',
  },
  {
    id: 'actor',
    name: 'Actor',
  },
];

const InspectorMultiVariablePicker = ({ style, value, onChange, ...props }) => {
  const selectedScopeIndex = value.scope === 'actor' ? 1 : 0;
  const selectedScope = SCOPE_ITEMS[selectedScopeIndex];

  const setId = React.useCallback((id) => onChange({ ...value, id }), [value, onChange]);
  const setScope = React.useCallback(
    // reset id when changing scope
    (scopeIndex) => onChange({ scope: SCOPE_ITEMS[scopeIndex].id, id: '' }),
    [value, onChange]
  );

  return (
    <View style={style}>
      <View style={styles.row}>
        <Text style={styles.label}>Type</Text>
        <InspectorSegmentedControl
          items={SCOPE_ITEMS}
          selectedItemIndex={selectedScopeIndex}
          onChange={setScope}
          style={styles.scopePicker}
        />
      </View>
      <View style={[styles.row, { marginTop: 4 }]}>
        <Text style={styles.label}>Name</Text>
        {selectedScope.id === 'global' ? (
          <InspectorGlobalVariablePicker {...props} value={value.id} onChange={setId} />
        ) : (
          <InspectorLocalVariablePicker {...props} value={value.id} onChange={setId} />
        )}
      </View>
    </View>
  );
};

const migrateLegacyValue = (value) => {
  if (typeof value === 'string') {
    return {
      scope: 'global',
      id: value,
    };
  }
  return value;
};

export const InspectorVariablePicker = (props) => {
  // props.value can either be a string like "none" (if it's from an old deck) or an object
  // like { scope: 'actor', id: '' }
  const { scopes, ...childProps } = props;

  if (!scopes || scopes === 'all') {
    // migrate legacy variables which only consist of global variable id string
    childProps.value = migrateLegacyValue(childProps.value);
    return <InspectorMultiVariablePicker {...childProps} />;
  } else if (scopes === 'actor') {
    return <InspectorLocalVariablePicker {...childProps} />;
  } else {
    return <InspectorGlobalVariablePicker {...childProps} />;
  }
};
