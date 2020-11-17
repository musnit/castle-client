import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InspectorDropdown } from './InspectorDropdown';
import { InspectorNumberInput } from './InspectorNumberInput';

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
    paddingBottom: 8,
  },
  paramName: {
    fontSize: 16,
    marginVertical: 8,
  },
  inset: {
    paddingLeft: 16,
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

const ExpressionParam = ({ name, paramSpec, value, onChange }) => {
  if (paramSpec.expression === false) {
    // leaf, disallow nested expression
    switch (paramSpec.method) {
      case 'numberInput':
        return <InspectorNumberInput value={value} onChange={onChange} />;
      default:
        throw new Error(`Unsupported leaf expression type: ${paramSpec.method}`);
    }
  }
  return null;
};

// TODO: use returnType to filter available expression types
export const InspectorExpressionInput = ({ expressions, value, onChange }) => {
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

  const onChangeParam = (name, paramValue) =>
    onChange({
      ...value,
      params: {
        ...value.params,
        [name]: paramValue,
      },
    });

  return (
    <React.Fragment>
      <View style={styles.expressionTypeRow}>
        <Text style={styles.description}>Set to</Text>
        <InspectorDropdown
          style={{ marginBottom: 0 }}
          value={expressionType}
          items={expressionTypes}
          onChange={onChangeExpressionType}
        />
      </View>
      <View style={styles.inset}>
        {Object.entries(expressionParamSpecs).map(([name, spec]) => (
          <React.Fragment>
            <Text key={`expression-name-${name}`} style={styles.paramName}>
              {spec.description}
            </Text>
            <ExpressionParam
              key={`expression-param-${name}`}
              name={name}
              paramSpec={spec}
              value={value.params[name]}
              onChange={(paramValue) => onChangeParam(name, paramValue)}
            />
          </React.Fragment>
        ))}
      </View>
    </React.Fragment>
  );
};
