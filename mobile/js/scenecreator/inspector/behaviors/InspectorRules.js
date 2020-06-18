import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorCheckbox } from '../components/InspectorCheckbox';

const styles = StyleSheet.create({
  container: {
    padding: 16,
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

const InspectorTrigger = ({ trigger }) => {
  if (!trigger) {
    return null;
  }
  // TODO: implement components to handle different trigger UIs here.
  switch (trigger.name) {
    case 'collide': {
      if (trigger.params.tag) {
        return (
          <Text style={styles.ruleName}>When this collides with tag: {trigger.params.tag}</Text>
        );
      } else {
        return <Text style={styles.ruleName}>When this collides with anything</Text>;
      }
    }
    case 'variable reaches value': {
      return (
        <Text style={styles.ruleName}>
          When variable {trigger.params.variableId} is {trigger.params.comparison}:{' '}
          {trigger.params.value}
        </Text>
      );
    }
    default:
      return (
        <Text style={styles.ruleName}>
          When: {trigger.name}, params: {JSON.stringify(trigger.params, null, 2)}
        </Text>
      );
  }
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
      <InspectorResponse response={response.params.nextResponse} order={order + 1} />
    </React.Fragment>
  );
};

const InspectorRule = ({ rule }) => {
  // trigger: params, name, behaviorId
  // response: params, name, behaviorId
  return (
    <View style={styles.rule}>
      <InspectorTrigger trigger={rule.trigger} />
      <View style={styles.insetContainer}>
        <InspectorResponse response={rule.response} />
      </View>
    </View>
  );
};

export default InspectorRules = ({ rules, sendAction }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rules (read only)</Text>
      <React.Fragment>
        {rules.isActive && Array.isArray(rules.properties.rules)
          ? rules.properties.rules.map((rule, ii) => (
              <InspectorRule key={`rule-${ii}`} rule={rule} />
            ))
          : null}
      </React.Fragment>
    </View>
  );
};
