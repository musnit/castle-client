import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BehaviorPropertyInputRow } from '../components/BehaviorPropertyInputRow';
import { BehaviorHeader } from '../components/BehaviorHeader';

import * as Constants from '../../../Constants';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderRadius: 6,
    borderColor: Constants.colors.black,
  },
  properties: {
    padding: 12,
    paddingBottom: 0,
  },
});

export default InspectorGenericBehavior = ({ behavior, sendAction, properties }) => {
  properties = properties ?? Object.keys(behavior.propertySpecs);
  return (
    <View style={styles.container}>
      <BehaviorHeader name={behavior.displayName} onRemove={() => sendAction('remove')} />
      {properties?.length ? (
        <View style={styles.properties}>
          {properties.map((propName, ii) => (
            <BehaviorPropertyInputRow
              key={`${behavior.name}-property-${ii}`}
              behavior={behavior}
              propName={propName}
              label={behavior.propertySpecs[propName].label}
              sendAction={sendAction}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};
