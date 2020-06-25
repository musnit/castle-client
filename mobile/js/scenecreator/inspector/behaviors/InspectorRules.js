import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { useGhostUI } from '../../../ghost/GhostUI';
import { sendDataPaneAction } from '../../../Tools';

import RulePartPickerSheet from './rules/RulePartPickerSheet';

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

const InspectorTrigger = ({ trigger, addChildSheet, triggers }) => {
  if (!trigger) {
    return null;
  }

  const onPickTrigger = () =>
    addChildSheet({
      key: 'rulePartPicker',
      Component: RulePartPickerSheet,
      entries: triggers,
    });

  let label;
  // TODO: implement components to handle different trigger UIs here.
  switch (trigger.name) {
    case 'collide':
      {
        if (trigger.params.tag) {
          label = `When this collides with tag: ${trigger.params.tag}`;
        } else {
          label = `When this collides`;
        }
      }
      break;
    case 'variable reaches value': {
      label = `When variable ${trigger.params.variableId} is ${trigger.params.comparison}: ${trigger.params.value}`;
      break;
    }
    default:
      label = `When: ${trigger.name}, params: ${JSON.stringify(trigger.params, null, 2)}`;
  }

  return (
    <TouchableOpacity onPress={onPickTrigger}>
      <Text style={styles.ruleName}>{label}</Text>
    </TouchableOpacity>
  );
};

const InspectorResponse = ({ response, order = 0 }) => {
  if (!response) {
    return null;
  }

  let responseContents;
  // TODO: implement components to handle different response UIs here.
  switch (response.name) {
    case 'if': {
      responseContents = (
        <React.Fragment>
          <Text style={styles.ruleName}>
            If: {response.params.condition?.name}{' '}
            {JSON.stringify(response.params.condition?.params)}
          </Text>
          <View style={styles.insetContainer}>
            <InspectorResponse response={response.params.then} />
          </View>
        </React.Fragment>
      );
      break;
    }
    case 'repeat': {
      responseContents = (
        <React.Fragment>
          <Text style={styles.ruleName}>Repeat {response.params?.count ?? 0} times</Text>
          <View style={styles.insetContainer}>
            <InspectorResponse response={response.params.body} />
          </View>
        </React.Fragment>
      );
      break;
    }
    case 'act on other': {
      responseContents = (
        <React.Fragment>
          <Text style={styles.ruleName}>Act on other</Text>
          <View style={styles.insetContainer}>
            <InspectorResponse response={response.params.body} />
          </View>
        </React.Fragment>
      );
      break;
    }
    default: {
      let paramsToRender = { ...response.params };
      delete paramsToRender.nextResponse;
      responseContents = (
        <Text>
          {response.name}: {JSON.stringify(paramsToRender, null, 2)}
        </Text>
      );
      break;
    }
  }

  return (
    <React.Fragment>
      <View style={[styles.response, order > 0 ? styles.nextResponse : null]}>
        {responseContents}
      </View>
      <InspectorResponse response={response.params?.nextResponse} order={order + 1} />
    </React.Fragment>
  );
};

const InspectorRule = ({ rule, addChildSheet, triggers, responses }) => {
  // trigger: params, name, behaviorId
  // response: params, name, behaviorId
  return (
    <View style={styles.rule}>
      <InspectorTrigger trigger={rule.trigger} addChildSheet={addChildSheet} triggers={triggers} />
      <View style={styles.insetContainer}>
        <InspectorResponse response={rule.response} />
      </View>
    </View>
  );
};

export default InspectorRules = ({ rules, sendAction, addChildSheet }) => {
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
    if (Array.isArray(rulesData.rules)) {
      rulesItems = rulesData.rules;
    } else {
      rulesItems = Object.entries(rulesData.rules).map(([_, rule]) => rule);
    }
  }

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
            key={`rule-${ii}`}
            rule={rule}
            addChildSheet={addChildSheet}
            triggers={rulesData.triggers}
            responses={rulesData.responses}
          />
        ))}
      </React.Fragment>
    </View>
  );
};
