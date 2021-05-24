import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConfigureExpressionSheet } from '../expressions/ConfigureExpressionSheet';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { RuleParamInputRow } from '../components/RuleParamInputRow';
import { useCardCreator } from '../../CreateCardContext';
import * as Constants from '../../../Constants';

const styles = StyleSheet.create({
  inputRow: {
    marginTop: 16,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 6,
  },
  relativeRow: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Constants.colors.grayOnWhiteBorder,
  },
});

export const BehaviorPropertyRule = ({
  response,
  onChangeResponse,
  addChildSheet,
  useAllBehaviors,
  children,
}) => {
  const context = useCardCreator();
  const { behaviors, behaviorActions } = context;
  const [lastNativeUpdate, setLastNativeUpdate] = React.useState(0);
  React.useEffect(() => setLastNativeUpdate(lastNativeUpdate + 1), [response?.params?.value]);

  const onChange = React.useCallback(
    (value) => {
      onChangeResponse({
        ...response,
        params: {
          ...response.params,
          value,
        },
      });
    },
    [response, onChangeResponse]
  );

  const onChangeRelative = React.useCallback(
    (relative) => {
      onChangeResponse({
        ...response,
        params: {
          ...response.params,
          relative,
        },
      });
    },
    [response, onChangeResponse]
  );

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

  const onConfigureExpression = () => {
    addChildSheet({
      key: 'configureExpression',
      label: propertySpec.label,
      Component: ConfigureExpressionSheet,
      value: response.params.value,
      onChange,
      useAllBehaviors,
    });
  };

  const isRelativeProperty = propertySpec.method === 'numberInput';

  return (
    <View>
      {children}
      <View style={styles.inputRow}>
        <RuleParamInputRow
          label={propertySpec.label}
          paramSpec={propertySpec}
          value={response.params.value}
          setValue={onChange}
          context={context}
          onConfigureExpression={onConfigureExpression}
          lastNativeUpdate={lastNativeUpdate}
        />
        {isRelativeProperty ? (
          <View style={styles.relativeRow}>
            <InspectorCheckbox
              label="Relative to current value"
              value={response.params.relative}
              onChange={onChangeRelative}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
};
