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
  ruleName: {
    marginVertical: 8,
  },
  response: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  insetContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
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
      return <Text style={styles.ruleName}>When: {trigger.name}</Text>;
  }
};

const InspectorResponse = ({ response }) => {
  if (!response) {
    return null;
  }
  let paramsToRender = { ...response.params };
  delete paramsToRender.nextResponse;
  return (
    <React.Fragment>
      <View style={styles.response}>
        <Text>{response.name}</Text>
        <Text>{JSON.stringify(paramsToRender, null, 2)}</Text>
      </View>
      <InspectorResponse response={response.params.nextResponse} />
    </React.Fragment>
  );
};

const InspectorRule = ({ rule }) => {
  // trigger: params, name, behaviorId
  // response: params, name, behaviorId
  return (
    <View>
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
        {rules.isActive && rules.properties.rules
          ? rules.properties.rules.map((rule, ii) => (
              <InspectorRule key={`rule-${ii}`} rule={rule} />
            ))
          : null}
      </React.Fragment>
    </View>
  );
};
