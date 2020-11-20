import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BehaviorPropertyExpression } from './BehaviorPropertyExpression';
import { InspectorDropdown } from '../components/InspectorDropdown';
import { ParamInput } from '../components/ParamInput';
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
export const InspectorExpressionInput = ({
  label,
  context,
  expressions,
  value,
  onChange,
  showBehaviorPropertyPicker,
}) => {
  const expressionTypes = Object.entries(expressions).map(([type, e]) => ({
    id: type,
    name: e.description,
  }));
  const expressionType =
    value.expressionType && expressions[value.expressionType] ? value.expressionType : 'number';
  const expressionParamSpecs = expressions[expressionType].paramSpecs;

  const onChangeExpressionType = React.useCallback(
    (expressionType) =>
      onChange(
        makeEmptyExpression({
          expressions,
          expressionType,
        })
      ),
    [onChange, expressions]
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

  const orderedParamSpecs = Object.entries(expressionParamSpecs).sort((a, b) => {
    const [k1, spec1] = a;
    const [k2, spec2] = b;
    const order1 = spec1.order ?? 9999;
    const order2 = spec2.order ?? 9999;
    return order1 < order2 ? -1 : 1;
  });

  return (
    <View style={styles.container}>
      <View style={styles.expressionTypeRow}>
        <Text style={styles.description}>{label ?? 'Set to'}:</Text>
        <InspectorDropdown
          style={{ marginBottom: 0 }}
          value={expressionType}
          labeledItems={expressionTypes}
          onChange={onChangeExpressionType}
        />
      </View>
      <View style={[SceneCreatorConstants.styles.insetContainer, styles.inset]}>
        {expressionType === 'behavior property' ? (
          <BehaviorPropertyExpression
            paramSpecs={expressionParamSpecs}
            value={value}
            onChange={onChange}
            context={context}
            showBehaviorPropertyPicker={showBehaviorPropertyPicker}
          />
        ) : (
          orderedParamSpecs.map(([name, spec]) => (
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
          ))
        )}
      </View>
    </View>
  );
};
