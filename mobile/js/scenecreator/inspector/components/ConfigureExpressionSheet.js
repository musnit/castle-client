import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { InspectorDropdown } from './InspectorDropdown';
import { InspectorNumberInput } from './InspectorNumberInput';
import { useCardCreator } from '../../CreateCardContext';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  description: {
    fontSize: 16,
  },
  expressionTypeRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnWhiteBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

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
const ExpressionInput = ({ expressions, value, onChange }) => {
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
        <Text style={styles.description}>Type</Text>
        <InspectorDropdown
          value={expressionType}
          items={expressionTypes}
          onChange={onChangeExpressionType}
        />
      </View>
      <View style={{ paddingLeft: 8 }}>
        {Object.entries(expressionParamSpecs).map(([name, spec]) => (
          <ExpressionParam
            key={`expression-param-${name}`}
            name={name}
            paramSpec={spec}
            value={value.params[name]}
            onChange={(paramValue) => onChangeParam(name, paramValue)}
          />
        ))}
      </View>
    </React.Fragment>
  );
};

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

const promoteToExpression = (initialValue) => {
  const initialType = typeof initialValue;
  switch (initialType) {
    case 'object':
      return initialValue;
    case 'number':
    case 'boolean':
      // promote from primitive to object
      return {
        expressionType: 'number',
        returnType: 'number',
        params: { value: initialValue },
      };
    default:
      throw new Error(`Invalid expression: ${JSON.stringify(initialValue)}`);
  }
};

export const ConfigureExpressionSheet = ({
  paramSpec,
  value: initialValue,
  onChange,
  isOpen,
  onClose,
}) => {
  const { expressions } = useCardCreator();
  const [value, setValue] = React.useState(promoteToExpression(initialValue));

  const renderContent = () => (
    <View style={styles.container}>
      <ExpressionInput expressions={expressions} value={value} onChange={setValue} />
    </View>
  );

  const onDone = React.useCallback(() => {
    console.log(`done: change to ${JSON.stringify(value, null, 2)}`);
    onChange(value);
    onClose();
  }, [onClose, value]);

  const renderHeader = () => (
    <BottomSheetHeader title={`Modify ${paramSpec.label}`} onClose={onClose} onDone={onDone} />
  );

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
