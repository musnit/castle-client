import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { RuleParamInputRow } from '../components/RuleParamInputRow';
import { useCardCreator } from '../../CreateCardContext';

export const BehaviorPropertyRule = ({ response, onChangeResponse, children }) => {
  const { behaviors, behaviorActions } = useCardCreator();

  const { name, propertyName } = response.params;
  const behavior = behaviors[name];
  if (!behavior) {
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
        style={{ marginTop: 8 }}
      />
    </View>
  );
};
