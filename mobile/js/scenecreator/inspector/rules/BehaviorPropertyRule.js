import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { RuleParamInputRow } from '../components/RuleParamInputRow';
import { useCardCreator } from '../../CreateCardContext';

const styles = StyleSheet.create({
  inputRow: {
    marginTop: 16,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 6,
    padding: 12,
  },
});

export const BehaviorPropertyRule = ({ response, onChangeResponse, children }) => {
  const { behaviors, behaviorActions } = useCardCreator();

  const { behaviorId, propertyName } = response.params;
  let behavior;
  const behaviorEntry = Object.entries(behaviors).find(([_, b]) => b.behaviorId === behaviorId);
  if (behaviorEntry) {
    behavior = behaviorEntry[1];
  } else {
    return children;
  }

  const propertySpec = behavior.propertySpecs[propertyName];
  const valueProp = response.name === 'change behavior property' ? 'changeBy' : 'setToValue';

  const onChange = (value) => {
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        [valueProp]: value,
      },
    });
  };

  return (
    <View>
      {children}
      <RuleParamInputRow
        label={propertySpec.label}
        paramSpec={propertySpec}
        value={response.params[valueProp]}
        setValue={onChange}
        style={styles.inputRow}
      />
    </View>
  );
};
