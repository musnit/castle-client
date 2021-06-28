import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Counter } from './InspectorBehaviors';
import { EditRuleSheet } from '../rules/EditRuleSheet';
import { RulePreview } from '../rules/RulePreview';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {},
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  rulePreviewButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    paddingBottom: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 3,
  },
});

export default InspectorRules = ({ behaviors, addChildSheet }) => {
  const rulesData = {}; // TODO: possible triggers, responses, etc.
  const rulesComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Rules');
  const sendRuleAction = React.useCallback((...args) => sendBehaviorAction('Rules', ...args), [
    sendBehaviorAction,
  ]);
  const counterComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Counter');
  const sendCounterAction = React.useCallback((...args) => sendBehaviorAction('Counter', ...args), [
    sendBehaviorAction,
  ]);
  const rulesItems = rulesComponent.rules;

  const rules = behaviors.Rules;
  const counter = behaviors.Counter;

  const onChangeRule = React.useCallback(
    (newRule) => {
      const newRules = rulesItems.map((oldRule) => {
        return oldRule.index === newRule.index ? newRule : oldRule;
      });
      sendRuleAction('change', newRules);
    },
    [rulesItems, sendRuleAction]
  );

  const onRemoveRule = React.useCallback(
    (rule) => {
      const newRules = rulesItems.filter((oldRule) => oldRule.index !== rule.index);
      sendRuleAction('change', newRules);
    },
    [rulesItems, sendRuleAction]
  );

  const onCopyRule = React.useCallback((rule) => sendRuleAction('copy', [rule]), [sendRuleAction]);

  const onPressRule = React.useCallback(
    (ruleIndex) =>
      addChildSheet({
        key: 'editRule',
        Component: EditRuleSheet,
        ruleIndex,
        onChangeRule,
        onRemoveRule,
        onCopyRule,
        behaviors,
        triggers: rulesData.triggers,
        responses: rulesData.responses,
        conditions: rulesData.conditions,
        sendRuleAction,
      }),
    [onChangeRule, rulesData, behaviors, sendRuleAction]
  );

  return (
    <React.Fragment>
      <View style={styles.container}>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={SceneCreatorConstants.styles.button}
            onPress={() => sendRuleAction('add')}>
            <Text style={SceneCreatorConstants.styles.buttonLabel}>Add rule</Text>
          </TouchableOpacity>
          {rulesData && !rulesData.isClipboardEmpty ? (
            <TouchableOpacity
              style={[SceneCreatorConstants.styles.button, { marginLeft: 16 }]}
              onPress={() => sendRuleAction('paste')}>
              <Text style={SceneCreatorConstants.styles.buttonLabel}>Paste rule</Text>
            </TouchableOpacity>
          ) : null}
          {!counterComponent?.isActive ? (
            <TouchableOpacity
              style={[SceneCreatorConstants.styles.button, { marginLeft: 16 }]}
              onPress={() => sendCounterAction('add')}>
              <Text style={SceneCreatorConstants.styles.buttonLabel}>Enable counter</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={{ flexDirection: 'column-reverse' }}>
          {rulesItems.map((rule, ii) => (
            <TouchableOpacity
              onPress={() => onPressRule(rule.index)}
              key={`rule-${rule.trigger?.name}-${rule.response?.name}-${ii}`}
              style={styles.rulePreviewButton}>
              <RulePreview rule={rule} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {counterComponent?.isActive ? <Counter counter={counter} /> : null}
    </React.Fragment>
  );
};
