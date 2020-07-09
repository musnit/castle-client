import * as React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { ConfigureRuleEntry } from './ConfigureRuleEntry';

import RulePartPickerSheet from './RulePartPickerSheet';

import { getEntryByName } from '../InspectorUtilities';
import { Triggers } from './Triggers';

const styles = StyleSheet.create({
  triggerCells: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

const TRIGGER_CATEGORY_ORDER = ['general', 'controls', 'state'];

const _entryToTrigger = (entry) => ({
  name: entry.name,
  behaviorId: entry.behaviorId,
  params: entry.initialParams ?? {},
});

export const Trigger = ({
  trigger,
  behaviors,
  context,
  addChildSheet,
  triggers,
  onChangeTrigger,
}) => {
  const onShowTriggerPicker = () =>
    addChildSheet({
      key: 'rulePartPicker',
      Component: RulePartPickerSheet,
      behaviors,
      entries: triggers,
      onSelectEntry: (entry) => onChangeTrigger(_entryToTrigger(entry)),
      title: 'Select trigger',
      categoryOrder: TRIGGER_CATEGORY_ORDER,
    });

  const onChangeParams = (params) =>
    onChangeTrigger({
      ...trigger,
      params: {
        ...trigger.params,
        ...params,
      },
    });

  let cells;
  if (!trigger || trigger.name === 'none') {
    cells = Triggers.empty();
  } else if (Triggers[trigger.name]) {
    cells = Triggers[trigger.name]({ trigger, context });
  } else {
    cells = Triggers.default({ trigger });
  }

  return (
    <View style={styles.triggerCells}>
      <ConfigureRuleEntry
        entry={getEntryByName(trigger.name, triggers)}
        cells={cells}
        onChangeEntry={onChangeTrigger}
        onShowPicker={onShowTriggerPicker}
        onChangeParams={onChangeParams}
        addChildSheet={addChildSheet}
      />
    </View>
  );
};
