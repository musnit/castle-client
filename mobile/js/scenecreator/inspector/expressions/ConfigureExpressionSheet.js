import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BehaviorPropertyExpression } from './BehaviorPropertyExpression';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { ExpressionTypePickerSheet } from './ExpressionTypePickerSheet';
import { ParamInput } from '../components/ParamInput';
import { promoteToExpression } from '../../SceneCreatorUtilities';
import { SelectBehaviorPropertySheet } from '../components/SelectBehaviorPropertySheet';
import { useCardCreator } from '../../CreateCardContext';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  container: {},
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
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
  paramContainer: {
    marginVertical: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderRadius: 6,
    borderColor: Constants.colors.black,
  },
  paramLabel: {
    fontSize: 16,
  },
  paramLabelRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  paramInput: {
    padding: 12,
  },
  swap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapLine: {
    position: 'absolute',
    top: 14,
    height: 1,
    width: '100%',
    backgroundColor: '#ddd',
  },
  swapButtonWrapper: {
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  swapButton: {
    ...SceneCreatorConstants.styles.button,
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingTop: 1,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const makeEmptyExpression = ({ expressions, expressionType, blueprint = null }) => {
  let expression = expressions[expressionType];
  let result = {
    expressionType,
    returnType: expression.returnType,
    params: {},
  };
  Object.entries(expression.paramSpecs).forEach(([name, spec]) => {
    if (blueprint?.params && blueprint.params[name]) {
      // try to map old params to new params if possible
      // TODO: we could also try to do this based on param order, not name
      result.params[name] = blueprint.params[name];
    } else {
      result.params[name] = spec.initialValue;
    }
  });
  return result;
};

const wrapExpression = ({ expression, expressions, wrappingType }) => {
  let result = makeEmptyExpression({ expressions, expressionType: wrappingType });
  let firstNumericParam = Object.entries(expressions[wrappingType].paramSpecs).find(
    ([_, spec]) =>
      (!spec.order || spec.order === 1) &&
      spec.method === 'numberInput' &&
      spec.expression !== false
  );
  if (firstNumericParam) {
    let [name, spec] = firstNumericParam;
    result.params[name] = expression;
  }
  return result;
};

// TODO: use returnType to filter available expression types
const InspectorExpressionInput = ({
  label,
  context,
  expressions,
  value,
  onChange,
  showBehaviorPropertyPicker,
  triggerFilter,
  addChildSheet,
  style,
  depth = 0,
}) => {
  const expressionType =
    value.expressionType && expressions[value.expressionType] ? value.expressionType : 'number';
  const expressionParamSpecs = expressions[expressionType].paramSpecs;
  const expressionLabel = expressions[expressionType].description;
  const [lastNativeUpdate, incrementLastNativeUpdate] = React.useReducer((state) => state + 1, 0);

  const onChangeExpressionType = React.useCallback(
    (expressionType) =>
      onChange(
        makeEmptyExpression({
          expressions,
          expressionType,
          blueprint: value,
        })
      ),
    [onChange, expressions, value]
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

  const onChooseExpressionType = React.useCallback(
    () =>
      addChildSheet({
        key: `chooseExpressionType-${depth}`,
        Component: ExpressionTypePickerSheet,
        onSelectExpressionType: onChangeExpressionType,
      }),
    [onChangeExpressionType]
  );

  const orderedParamSpecs = Object.entries(expressionParamSpecs).sort((a, b) => {
    const [k1, spec1] = a;
    const [k2, spec2] = b;
    const order1 = spec1.order ?? 9999;
    const order2 = spec2.order ?? 9999;
    return order1 < order2 ? -1 : 1;
  });

  const onSwapParams = React.useCallback(
    (firstParamIndex) => {
      const [name1, spec1] = orderedParamSpecs[firstParamIndex];
      const [name2, spec2] = orderedParamSpecs[firstParamIndex + 1];
      const val1 = value.params[name1];
      const val2 = value.params[name2];
      onChange({
        ...value,
        params: {
          ...value.params,
          [name1]: val2,
          [name2]: val1,
        },
      });
      incrementLastNativeUpdate();
    },
    [orderedParamSpecs, value]
  );

  return (
    <View style={style}>
      <View style={styles.expressionTypeRow}>
        <Text style={styles.description}>{label ?? 'Set to'}:</Text>
        <TouchableOpacity
          style={SceneCreatorConstants.styles.button}
          onPress={onChooseExpressionType}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>{expressionLabel}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inset}>
        {expressionType === 'behavior property' ? (
          <BehaviorPropertyExpression
            paramSpecs={expressionParamSpecs}
            value={value}
            onChange={onChange}
            context={context}
            showBehaviorPropertyPicker={showBehaviorPropertyPicker}
            triggerFilter={triggerFilter}
            style={styles.paramContainer}
          />
        ) : (
          orderedParamSpecs.map(([name, spec], ii) => {
            const paramValue = value.params ? value.params[name] : value;
            const setValue = (paramValue) => onChangeParam(name, paramValue);
            const onConfigureExpression = () => {
              addChildSheet({
                key: `configureExpression-${depth}`,
                depth: depth + 1,
                label: `Nested Expression`, // TODO: provide further info?
                Component: ConfigureExpressionSheet,
                value: paramValue,
                onChange: setValue,
              });
            };
            return (
              <>
                <View
                  style={styles.paramContainer}
                  key={`expression-param-${name}-${expressionType}`}>
                  {spec.method !== 'toggle' ? (
                    <View style={styles.paramLabelRow}>
                      <Text style={styles.paramLabel}>{spec.label}</Text>
                    </View>
                  ) : null}
                  <ParamInput
                    label={spec.label}
                    name={name}
                    paramSpec={spec}
                    style={styles.paramInput}
                    value={paramValue}
                    setValue={setValue}
                    expressions={expressions}
                    context={context}
                    onConfigureExpression={onConfigureExpression}
                    lastNativeUpdate={lastNativeUpdate}
                  />
                </View>
                {orderedParamSpecs.length == 2 && ii < orderedParamSpecs.length - 1 ? (
                  <View key={`swap-expression-param-${expressionType}-${ii}`} style={styles.swap}>
                    <View style={styles.swapLine} />
                    <View style={styles.swapButtonWrapper}>
                      <View style={styles.swapButton}>
                        <TouchableOpacity onPress={() => onSwapParams(ii)}>
                          <MCIcon name="swap-vertical" size={24} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : null}
              </>
            );
          })
        )}
      </View>
    </View>
  );
};

// does it have 1 or more numeric, expression-enabled parameters?
const canExpressionHaveChildren = ([name, spec]) =>
  Object.entries(spec.paramSpecs).filter(
    ([k, paramSpec]) => paramSpec.method === 'numberInput' && paramSpec.expression !== false
  ).length > 0;

export const ConfigureExpressionSheet = ({
  value: initialValue,
  label,
  triggerFilter,
  onChange,
  isOpen,
  onClose,
  addChildSheet,
  depth = 0,

  // `true` if we are wrapped in `Act On` or some other situation where we don't want
  // to filter behaviors by the owning actor.
  useAllBehaviors = false,
}) => {
  const createCardContext = useCardCreator();
  const [value, setValue] = React.useState(promoteToExpression(initialValue));

  const showWrappingExpressionPicker = React.useCallback(
    () =>
      addChildSheet({
        key: `chooseExpressionType-${depth}`,
        Component: ExpressionTypePickerSheet,
        filterExpression: canExpressionHaveChildren,
        onSelectExpressionType: (wrappingType) =>
          setValue(
            wrapExpression({
              expressions: createCardContext.expressions,
              expression: value,
              wrappingType,
            })
          ),
      }),
    [value, createCardContext.expressions]
  );

  const showBehaviorPropertyPicker = React.useCallback(
    (args) => {
      // the calling context might also provide useAllBehaviors == true, independent of whether
      // this component has props.useAllBehaviors == true. for example
      // when setting a behavior property belonging to an `other` actorRef
      const { onSelectBehaviorProperty, useAllBehaviors: childUseAllBehaviors } = args;
      return addChildSheet({
        key: 'expressionBehaviorPropertyPicker',
        Component: SelectBehaviorPropertySheet,
        behaviors: createCardContext.behaviors,
        useAllBehaviors: useAllBehaviors || childUseAllBehaviors,
        isPropertyVisible: (spec) => spec?.rules?.get === true,
        onSelectBehaviorProperty,
      });
    },
    [createCardContext.behaviors, useAllBehaviors]
  );

  const renderContent = () => (
    <View style={styles.container}>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={SceneCreatorConstants.styles.button}
          onPress={showWrappingExpressionPicker}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>Wrap in expression</Text>
        </TouchableOpacity>
      </View>
      <InspectorExpressionInput
        depth={depth}
        context={createCardContext}
        expressions={createCardContext.expressions}
        value={value}
        onChange={setValue}
        showBehaviorPropertyPicker={showBehaviorPropertyPicker}
        triggerFilter={triggerFilter}
        addChildSheet={addChildSheet}
        style={{ padding: 16 }}
      />
    </View>
  );

  const onDone = React.useCallback(() => {
    onChange(value);
    onClose();
  }, [onClose, value]);

  const renderHeader = () => (
    <BottomSheetHeader title={`Modify ${label}`} onClose={onClose} onDone={onDone} />
  );

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
