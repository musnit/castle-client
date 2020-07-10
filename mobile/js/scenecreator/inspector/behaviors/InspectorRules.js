import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { useGhostUI } from '../../../ghost/GhostUI';
import { sendDataPaneAction } from '../../../Tools';
import { Counter } from './InspectorBehaviors';
import { Response as InspectorResponse } from '../rules/Response';
import { Trigger as InspectorTrigger } from '../rules/Trigger';

import RulePartPickerSheet from '../rules/RulePartPickerSheet';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';
import * as Constants from '../../../Constants';

const styles = StyleSheet.create({
  container: {},
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  rule: {
    paddingTop: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderColor: Constants.colors.grayOnWhiteBorder,
    borderTopWidth: 1,
  },
});

const InspectorRule = ({
  rule,
  behaviors,
  triggers,
  responses,
  conditions,
  context,
  addChildSheet,
  onChangeRule,
}) => {
  const onChangeTrigger = React.useCallback(
    (trigger) => {
      return onChangeRule({
        ...rule,
        trigger,
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
        context={context}
        addChildSheet={addChildSheet}
        triggers={triggers}
        onChangeTrigger={onChangeTrigger}
      />
      <View style={SceneCreatorConstants.styles.insetContainer}>
        <InspectorResponse
          response={rule.response}
          triggerFilter={rule.trigger?.name}
          behaviors={behaviors}
          context={context}
          addChildSheet={addChildSheet}
          responses={responses}
          conditions={conditions}
          onChangeResponse={onChangeResponse}
        />
      </View>
    </View>
  );
};

export default InspectorRules = ({ behaviors, sendActions, context, addChildSheet }) => {
  const rules = behaviors.Rules;
  const counter = behaviors.Counter;

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
    <React.Fragment>
      <View style={styles.container}>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={SceneCreatorConstants.styles.button}
            onPress={() => sendRuleAction('add')}>
            <Text style={SceneCreatorConstants.styles.buttonLabel}>Add new rule</Text>
          </TouchableOpacity>
          {!counter.isActive ? (
            <TouchableOpacity
              style={[SceneCreatorConstants.styles.button, { marginLeft: 16 }]}
              onPress={() => sendActions.Counter('add')}>
              <Text style={SceneCreatorConstants.styles.buttonLabel}>Enable counter</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <React.Fragment>
          {rulesItems.map((rule, ii) => (
            <InspectorRule
              key={`rule-${rule.trigger?.name}-${rule.response?.name}-${ii}`}
              rule={rule}
              onChangeRule={onChangeRule}
              behaviors={behaviors}
              context={context}
              addChildSheet={addChildSheet}
              triggers={rulesData.triggers}
              responses={rulesData.responses}
              conditions={rulesData.conditions}
            />
          ))}
        </React.Fragment>
      </View>
      {counter?.isActive ? <Counter counter={counter} sendAction={sendActions.Counter} /> : null}
    </React.Fragment>
  );
};
