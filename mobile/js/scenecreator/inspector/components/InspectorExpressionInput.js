import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InspectorDropdown } from './InspectorDropdown';
import { ParamInput } from './ParamInput';
import { promoteToExpression } from '../../SceneCreatorUtilities';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  description: {
    fontSize: 16,
    marginRight: 8,
  },
  expressionTypeRow: {
    // borderBottomWidth: 1,
    // borderBottomColor: Constants.colors.grayOnWhiteBorder,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  paramName: {
    fontSize: 16,
    marginVertical: 8,
  },
  inset: {
    marginTop: 12,
  },
  paramLabel: {
    fontSize: 14,
    marginVertical: 4,
  },
  inputRow: {
    marginTop: 8,
  },
});

const makeEmptyExpression = ({ expressions, expressionType }) => {
  let expression = expressions[expressionType];
  let result = {
    expressionType,
    returnType: expression.returnType,
    params: {},
  };
  Object.entries(expression.paramSpecs).forEach(([name, spec]) => {
    result.params[name] = spec.initialValue;
  });
  return result;
};

// TODO: use returnType to filter available expression types
export const InspectorExpressionInput = ({ label, context, expressions, value, onChange }) => {
  const expressionTypes = Object.keys(expressions);
  const expressionType =
    value.expressionType && expressions[value.expressionType]
      ? value.expressionType
      : expressionTypes[0];
  const expressionParamSpecs = expressions[expressionType].paramSpecs;

  const onChangeExpressionType = (expressionType) =>
    onChange(
      makeEmptyExpression({
        expressions,
        expressionType,
      })
    );

  const onChangeParam = (name, paramValue) => {
    if (typeof value !== 'object') {
      value = promoteToExpression(value);
    }
    onChange({
      ...value,
      params: {
        ...value.params,
        [name]: paramValue,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.expressionTypeRow}>
        <Text style={styles.description}>{label ?? 'Set to'}:</Text>
        <InspectorDropdown
          style={{ marginBottom: 0 }}
          value={expressionType}
          items={expressionTypes}
          onChange={onChangeExpressionType}
        />
      </View>
      <View style={[SceneCreatorConstants.styles.insetContainer, styles.inset]}>
        {Object.entries(expressionParamSpecs).map(([name, spec]) => (
          <View style={styles.inputRow} key={`expression-param-${name}`}>
            <ParamInput
              label={spec.label}
              name={name}
              paramSpec={spec}
              value={value.params ? value.params[name] : value}
              setValue={(paramValue) => onChangeParam(name, paramValue)}
              expressions={expressions}
              context={context}
              ExpressionInputComponent={InspectorExpressionInput}
            />
            {spec.method !== 'toggle' &&
            (spec.method !== 'numberInput' || spec.expression === false) ? (
              <Text style={styles.paramLabel}>{spec.label}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
};
