import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { sendDataPaneAction, useGhostUI } from '../../../ghost/GhostUI';
import { Counter } from './InspectorBehaviors';
import { RulePreview } from '../rules/RulePreview';

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
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 3,
  },
});

export default InspectorRules = ({ behaviors, sendActions, addChildSheet }) => {
  const rules = behaviors.Rules;
  const counter = behaviors.Counter;

  // TODO: would be nice not to subscribe here
  const { root } = useGhostUI();
  const element = root?.panes ? root.panes['sceneCreatorRules'] : null;

  let rulesData, sendRuleAction;
  if (element?.children.count) {
    Object.entries(element.children).forEach(([key, child]) => {
      if (child.type === 'data') {
        const data = child.props.data;
        if (data.name === 'Rules') {
          rulesData = data;
        }
        sendRuleAction = (action, value) => sendDataPaneAction(element, action, value, key);
      }
    });
  }

  let rulesItems = [];
  if (rulesData) {
    // there's an issue with the lua bridge applying a diff to arrays,
    // make sure we don't have one here
    if (Array.isArray(rulesData.rules)) {
      throw new Error(`Expecting a dictionary of Rules, got an array.`);
    } else {
      rulesItems = Object.entries(rulesData.rules)
        .map(([index, rule]) => ({ ...rule, index }))
        .sort((a, b) => parseInt(b.index, 10) < parseInt(a.index, 10));
    }
  }

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
              key={`rule-${rule.trigger?.name}-${rule.response?.name}-${ii}`}
              style={styles.rulePreviewButton}>
              <RulePreview
                rule={rule}
                behaviors={behaviors}
                addChildSheet={addChildSheet}
                triggers={rulesData.triggers}
                responses={rulesData.responses}
                conditions={rulesData.conditions}
                sendRuleAction={sendRuleAction}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {counter?.isActive ? <Counter counter={counter} sendAction={sendActions.Counter} /> : null}
    </React.Fragment>
  );
};
