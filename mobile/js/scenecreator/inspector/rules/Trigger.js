import * as React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';

import RulePartPickerSheet from './RulePartPickerSheet';

const styles = StyleSheet.create({
  // TODO: merge shared styles
  ruleName: {
    marginBottom: 8,
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

  let label;
  if (!trigger || trigger.name === 'none') {
    label = '<select trigger>';
  } else {
    // TODO: implement components to handle different trigger UIs here.
    switch (trigger.name) {
      case 'collide':
        {
          if (trigger.params.tag) {
            label = `this collides with tag: ${trigger.params.tag}`;
          } else {
            label = `this collides`;
          }
        }
        break;
      case 'variable reaches value': {
        label = `variable ${trigger.params.variableId} is ${trigger.params.comparison}: ${trigger.params.value}`;
        break;
      }
      default:
        label = `${trigger.name}, params: ${JSON.stringify(trigger.params, null, 2)}`;
    }
  }

  return (
    <View style={{ flexDirection: 'row' }}>
      <TouchableOpacity onPress={onModifyTrigger} style={{ marginRight: 8 }}>
        <Text>When:</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPickTrigger}>
        <Text style={styles.ruleName}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
};
