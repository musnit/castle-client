import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EditRuleSheet } from '../rules/EditRuleSheet';
import { RulePreview } from '../rules/RulePreview';
import { useCoreState, sendBehaviorAction } from '../../../core/CoreEvents';

import * as RulesClipboard from '../rules/RulesClipboard';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

import Counter from './InspectorCounter';

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

const EMPTY_RULE = {
  trigger: {
    name: 'none',
    behaviorId: null,
  },
  response: {
    name: 'none',
    behaviorId: null,
  },
};

function removeEmpty(obj) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v != null)
      .map(([k, v]) => [k, v === Object(v) ? removeEmpty(v) : v])
  );
}

export default InspectorRules = ({ behaviors, addChildSheet }) => {
  const rulesData = useCoreState('EDITOR_RULES_DATA');
  const rulesComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Rules');
  const sendRuleAction = React.useCallback((...args) => sendBehaviorAction('Rules', ...args), [
    sendBehaviorAction,
  ]);
  const selectedActorData = useCoreState('EDITOR_SELECTED_ACTOR');
  const isCounterActive = selectedActorData.behaviors.Counter.isActive;
  const sendSetRules = React.useCallback(
    (newRules) => {
      // The old editor can't handle "null"s. Sometimes the rules code would add `"else": null` without this.
      for (let i = 0; i < newRules.length; i++) {
        newRules[i] = removeEmpty(newRules[i]);
      }
      sendRuleAction('set', 'rules', 'string', JSON.stringify({ rules: newRules }));
    },
    [sendRuleAction]
  );
  const counterComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Counter');
  const sendCounterAction = React.useCallback((...args) => sendBehaviorAction('Counter', ...args), [
    sendBehaviorAction,
  ]);

  let rulesItems = rulesComponent?.rules ?? [];
  if (!Array.isArray(rulesItems)) {
    // some legacy scene json contains `rules: {}`
    rulesItems = [];
  }

  const rules = behaviors.Rules;
  const counter = behaviors.Counter;

  const onChangeRule = React.useCallback(
    (newRule, index) => {
      const newRules = rulesItems.map((oldRule, ii) => {
        return ii === index ? newRule : oldRule;
      });
      sendSetRules(newRules);
    },
    [rulesItems, sendSetRules]
  );

  const onAddRule = React.useCallback(() => {
    const newRules = rulesItems ? rulesItems.concat([EMPTY_RULE]) : [EMPTY_RULE];
    sendSetRules(newRules);
  }, [rulesItems, sendSetRules]);

  const onRemoveRule = React.useCallback(
    (rule, index) => {
      const newRules = rulesItems.filter((oldRule, ii) => ii != index);
      sendSetRules(newRules);
    },
    [rulesItems, sendSetRules]
  );

  const onCopyRule = React.useCallback((rule) => RulesClipboard.copyRule(rule));

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
      }),
    [onChangeRule, rulesData, behaviors]
  );

  return (
    <React.Fragment>
      <View style={styles.container}>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={SceneCreatorConstants.styles.button} onPress={onAddRule}>
            <Text style={SceneCreatorConstants.styles.buttonLabel}>Add rule</Text>
          </TouchableOpacity>
          {rulesData && !RulesClipboard.isEmpty() ? (
            <TouchableOpacity
              style={[SceneCreatorConstants.styles.button, { marginLeft: 16 }]}
              onPress={() => sendSetRules(RulesClipboard.paste(rulesItems))}>
              <Text style={SceneCreatorConstants.styles.buttonLabel}>Paste rule</Text>
            </TouchableOpacity>
          ) : null}
          {!isCounterActive ? (
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
              onPress={() => onPressRule(ii)}
              key={`rule-${rule.trigger?.name}-${rule.response?.name}-${ii}`}
              style={styles.rulePreviewButton}>
              <RulePreview rule={rule} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {isCounterActive ? <Counter counter={counter} /> : null}
    </React.Fragment>
  );
};
