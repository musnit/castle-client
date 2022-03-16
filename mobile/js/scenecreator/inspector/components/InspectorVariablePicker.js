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
  scopeContainer: { flexDirection: 'row', alignItems: 'center' },
  scopePicker: { flexShrink: 1, maxWidth: 128, marginRight: 8 },
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
    <View style={[styles.container, style]} {...props}>
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
    <View style={[styles.container, style]} {...props}>
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
    id: 'local',
    name: 'Actor',
  },
];

const InspectorMultiVariablePicker = ({ variableProps, ...props }) => {
  const { localValue, setLocalValue } = variableProps;
  const { value: globalValue, onChange: setGlobalValue } = props;

  const [selectedScopeIndex, setSelectedScopeIndex] = React.useState(localValue?.length ? 1 : 0);
  const selectedScope = SCOPE_ITEMS[selectedScopeIndex];

  const setValue = React.useCallback(
    (value) => {
      // when setting value for one scope, need to also clear values for other scopes
      const selectedScope = SCOPE_ITEMS[selectedScopeIndex];
      if (selectedScope?.id === 'global') {
        setLocalValue('');
        setGlobalValue(value);
      } else {
        setGlobalValue('(none)');
        setLocalValue(value);
      }
    },
    [selectedScopeIndex, setLocalValue, setGlobalValue]
  );

  return (
    <View style={styles.scopeContainer}>
      <InspectorSegmentedControl
        items={SCOPE_ITEMS}
        selectedItemIndex={selectedScopeIndex}
        onChange={setSelectedScopeIndex}
        style={styles.scopePicker}
      />
      {selectedScope.id === 'global' ? (
        <InspectorGlobalVariablePicker {...props} value={globalValue} onChange={setValue} />
      ) : (
        <InspectorLocalVariablePicker {...props} value={localValue} onChange={setValue} />
      )}
    </View>
  );
};

export const InspectorVariablePicker = ({ variableProps, ...props }) => {
  const scopes = variableProps?.scopes || 'global';
  if (scopes === 'all') {
    return <InspectorMultiVariablePicker variableProps={variableProps} {...props} />;
  } else {
    // scopes not specified, fall back to global-only behavior
    return <InspectorGlobalVariablePicker {...props} />;
  }
};
