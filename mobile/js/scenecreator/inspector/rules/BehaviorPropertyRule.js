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
  const [lastNativeUpdate, setLastNativeUpdate] = React.useState(0);
  React.useEffect(() => setLastNativeUpdate(lastNativeUpdate + 1), [response?.params?.value]);

  const { behaviorId, propertyName } = response.params;
  let behavior;
  const behaviorEntry = Object.entries(behaviors).find(([_, b]) => b.behaviorId === behaviorId);
  if (behaviorEntry) {
    behavior = behaviorEntry[1];
  } else {
    return children;
  }

  let propertySpec = behavior.propertySpecs[propertyName];

  // don't enforce absolute min/max when choosing a relative value
  if (response.name === 'change behavior property' && propertySpec.props) {
    propertySpec = {
      ...propertySpec,
      props: {
        ...propertySpec.props,
        min: undefined,
        max: undefined,
      },
    };
  }

  const onChange = (value) => {
    onChangeResponse({
      ...response,
      params: {
        ...response.params,
        value,
      },
    });
  };

  return (
    <View>
      {children}
      <RuleParamInputRow
        label={propertySpec.label}
        paramSpec={propertySpec}
        value={response.params.value}
        setValue={onChange}
        style={styles.inputRow}
        lastNativeUpdate={lastNativeUpdate}
      />
    </View>
  );
};
