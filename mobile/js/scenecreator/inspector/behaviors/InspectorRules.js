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
      <Text style={styles.ruleName}>When: {rule.trigger?.name}</Text>
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
        {rules.isActive
          ? rules.properties.rules.map((rule, ii) => (
              <InspectorRule key={`rule-${ii}`} rule={rule} />
            ))
          : null}
      </React.Fragment>
    </View>
  );
};
