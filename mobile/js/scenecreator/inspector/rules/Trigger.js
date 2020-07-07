import * as React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { ConfigureRuleEntry } from './ConfigureRuleEntry';

import RulePartPickerSheet from './RulePartPickerSheet';

import { Triggers } from './Triggers';

const styles = StyleSheet.create({
  // TODO: merge shared styles
  ruleName: {
    marginBottom: 8,
  },
  triggerCells: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export const Trigger = ({ trigger, behaviors, addChildSheet, triggers, onChangeTrigger }) => {
  const onModifyTrigger = () => {
    // TODO: up, down, wrap, before, replace, remove
  };

  const onPickTrigger = () =>
    addChildSheet({
      key: 'rulePartPicker',
      Component: RulePartPickerSheet,
      behaviors,
      entries: triggers,
      onSelectEntry: onChangeTrigger,
      title: 'Select trigger',
    });

  let cells;
  if (!trigger || trigger.name === 'none') {
    cells = Triggers.empty();
  } else if (Triggers[trigger.name]) {
    cells = Triggers[trigger.name]({ trigger });
  } else {
    cells = Triggers.default({ trigger });
  }

  return (
    <View style={styles.triggerCells}>
      <TouchableOpacity onPress={onModifyTrigger} style={{ marginRight: 8 }}>
        <Text>When:</Text>
      </TouchableOpacity>
      <ConfigureRuleEntry cells={cells} onPickEntry={onPickTrigger} />
    </View>
  );
};
