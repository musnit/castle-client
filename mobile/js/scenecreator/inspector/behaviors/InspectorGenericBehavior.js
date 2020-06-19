import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  title: {
    fontWeight: 'bold',
    paddingBottom: 16,
  },
});

export default InspectorGenericBehavior = ({ behavior, sendAction, properties }) => {
  properties = properties ?? Object.keys(behavior.propertySpecs);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{behavior.name}</Text>
      {properties.map((propName) => (
        <BehaviorPropertyInputRow
          behavior={behavior}
          propName={propName}
          label={propName}
          sendAction={sendAction}
        />
      ))}
    </View>
  );
};
