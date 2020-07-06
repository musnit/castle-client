import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { useGhostUI } from '../../../ghost/GhostUI';
import { sendDataPaneAction } from '../../../Tools';
import { Response as InspectorResponse } from '../rules/Response';
import { Trigger as InspectorTrigger } from '../rules/Trigger';

import RulePartPickerSheet from '../rules/RulePartPickerSheet';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  actionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  addButton: {
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 3,
    padding: 8,
  },
  addLabel: {
    fontWeight: 'bold',
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 16,
  },
  rule: {
    marginBottom: 16,
  },
  ruleName: {
    marginBottom: 8,
  },
  response: {
    paddingBottom: 8,
  },
  nextResponse: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  insetContainer: {
    paddingTop: 16,
    paddingLeft: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopLeftRadius: 6,
    borderColor: '#ccc',
  },
});

const InspectorRule = ({
  rule,
  behaviors,
  triggers,
  responses,
  conditions,
  addChildSheet,
  onChangeRule,
}) => {
  const onChangeTrigger = React.useCallback(
    (entry) => {
      return onChangeRule({
        ...rule,
        trigger: {
          name: entry.name,
          behaviorId: entry.behaviorId,
          params: entry.initialParams ?? {},
        },
      });
    },
    [onChangeRule]
  );

  const onChangeResponse = React.useCallback(
    (response) => {
      return onChangeRule({
        ...rule,
        response,
      });
    },
    [onChangeRule]
  );

  return (
    <View style={styles.rule}>
      <InspectorTrigger
        trigger={rule.trigger}
        behaviors={behaviors}
        addChildSheet={addChildSheet}
        triggers={triggers}
        onChangeTrigger={onChangeTrigger}
      />
      <View style={styles.insetContainer}>
        <InspectorResponse
          response={rule.response}
          behaviors={behaviors}
          addChildSheet={addChildSheet}
          responses={responses}
          conditions={conditions}
          onChangeResponse={onChangeResponse}
        />
      </View>
    </View>
  );
};

export default InspectorRules = ({ behaviors, sendAction, addChildSheet }) => {
  const rules = behaviors.Rules;

  // TODO: would be nice not to subscribe here
  const { root } = useGhostUI();
  const element = root?.panes ? root.panes['sceneCreatorRules'] : null;

  let rulesData, sendRuleAction;
  if (element.children.count) {
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

  return (
    <View style={styles.container}>
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.addButton} onPress={() => sendRuleAction('add')}>
          <Text style={styles.addLabel}>Add new rule</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Rules (read only)</Text>
      <React.Fragment>
        {rulesItems.map((rule, ii) => (
          <InspectorRule
            key={`rule-${rule.trigger?.name}-${rule.response?.name}-${ii}`}
            rule={rule}
            onChangeRule={onChangeRule}
            behaviors={behaviors}
            addChildSheet={addChildSheet}
            triggers={rulesData.triggers}
            responses={rulesData.responses}
            conditions={rulesData.conditions}
          />
        ))}
      </React.Fragment>
    </View>
  );
};
