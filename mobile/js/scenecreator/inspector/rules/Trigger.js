import * as React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { ConfigureRuleEntry } from './ConfigureRuleEntry';
import { getRuleRenderContext } from './RuleRenderContext';

import Metadata from '../../Metadata';
import RuleOptionsSheet from './RuleOptionsSheet';
import RulePartPickerSheet from './RulePartPickerSheet';

import { getEntryByName } from '../InspectorUtilities';
import { Triggers } from './Triggers';

const styles = StyleSheet.create({
  triggerCells: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

const _entryToTrigger = (entry) => ({
  name: entry.name,
  behaviorId: entry.behaviorId,
  params: entry.paramSpecs
    ? Object.entries(entry.paramSpecs).reduce((params, [key, spec]) => {
        params[key] = spec.initialValue;
        return params;
      }, {})
    : {},
});

export const Trigger = ({ trigger, behaviors, addChildSheet, triggers, onChangeTrigger }) => {
  const context = getRuleRenderContext();

  const onShowTriggerPicker = React.useCallback(
    () =>
      addChildSheet({
        key: 'rulePartPicker',
        Component: RulePartPickerSheet,
        behaviors,
        entries: triggers,
        onSelectEntry: (entry) => onChangeTrigger(_entryToTrigger(entry)),
        title: 'Select trigger',
        categoryOrder: Metadata.triggerCategoryOrder,
      }),
    [addChildSheet, behaviors, triggers, onChangeTrigger]
  );

  const onShowRuleOptions = React.useCallback(
    () =>
      addChildSheet({
        key: 'ruleOptions',
        Component: RuleOptionsSheet,
        actions: {
          // remove: onRemoveRule,
          // copy: onCopyRule,
        },
        type: 'rule',
      }),
    [addChildSheet]
  );

  const onChangeParams = React.useCallback(
    (params) =>
      onChangeTrigger({
        ...trigger,
        params: {
          ...trigger.params,
          ...params,
        },
      }),
    [trigger, onChangeTrigger]
  );

  let cells = Triggers.makeCells({ trigger, context });

  return (
    <View style={styles.triggerCells}>
      <ConfigureRuleEntry
        entry={getEntryByName(trigger.name, triggers)}
        cells={cells}
        onChangeEntry={onChangeTrigger}
        onShowPicker={onShowTriggerPicker}
        onChangeParams={onChangeParams}
        addChildSheet={addChildSheet}
        onShowOptions={onShowRuleOptions}
      />
    </View>
  );
};
