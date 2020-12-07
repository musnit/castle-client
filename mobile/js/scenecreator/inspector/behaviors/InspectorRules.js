import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Counter } from './InspectorBehaviors';
import { EditRuleSheet } from '../rules/EditRuleSheet';
import { RulePreview } from '../rules/RulePreview';
import { useCardCreator } from '../../CreateCardContext';

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

export default InspectorRules = ({ behaviors, sendActions, addChildSheet }) => {
  const { rules: rulesContext } = useCardCreator();
  const { data: rulesData, sendAction: sendRuleAction, items: rulesItems } = rulesContext;

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
    (rule) =>
      addChildSheet({
        key: 'editRule',
        Component: EditRuleSheet,
        onChangeRule,
        onRemoveRule,
        onCopyRule,
        rule,
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
          {!counter.isActive ? (
            <TouchableOpacity
              style={[SceneCreatorConstants.styles.button, { marginLeft: 16 }]}
              onPress={() => sendActions.Counter('add')}>
              <Text style={SceneCreatorConstants.styles.buttonLabel}>Enable counter</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={{ flexDirection: 'column-reverse' }}>
          {rulesItems.map((rule, ii) => (
            <TouchableOpacity
              onPress={() => onPressRule(rule)}
              key={`rule-${rule.trigger?.name}-${rule.response?.name}-${ii}`}
              style={styles.rulePreviewButton}>
              <RulePreview rule={rule} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {counter?.isActive ? <Counter counter={counter} sendAction={sendActions.Counter} /> : null}
    </React.Fragment>
  );
};
