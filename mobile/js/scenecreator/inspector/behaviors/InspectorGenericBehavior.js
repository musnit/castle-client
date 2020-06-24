import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';
import { BehaviorHeader } from '../components/BehaviorHeader';

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderRadius: 3,
    borderColor: '#000',
  },
  properties: {
    padding: 16,
  },
});

export default InspectorGenericBehavior = ({ behavior, sendAction, properties }) => {
  properties = properties ?? Object.keys(behavior.propertySpecs);
  return (
    <View style={styles.container}>
      <BehaviorHeader name={behavior.name} />
      {properties?.length ? (
        <View style={styles.properties}>
          {properties.map((propName, ii) => (
            <BehaviorPropertyInputRow
              key={`${behavior.name}-property-${ii}`}
              behavior={behavior}
              propName={propName}
              label={propName}
              sendAction={sendAction}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};
