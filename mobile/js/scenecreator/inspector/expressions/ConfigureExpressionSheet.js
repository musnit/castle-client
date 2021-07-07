import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BehaviorPropertyExpression } from './BehaviorPropertyExpression';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { ExpressionTypePickerSheet } from './ExpressionTypePickerSheet';
import { ParamInput } from '../components/ParamInput';
import { promoteToExpression } from '../../SceneCreatorUtilities';
import { SelectBehaviorPropertySheet } from '../components/SelectBehaviorPropertySheet';
import { useCoreState } from '../../../core/CoreEvents';

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
  expression.paramSpecs.forEach((spec) => {
    const { name } = spec;
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
  let firstNumericParamSpec = expressions[wrappingType].paramSpecs.find(
    (spec) =>
      (!spec.order || spec.order === 1) &&
      spec.method === 'numberInput' &&
      spec.expression !== false
  );
  if (firstNumericParamSpec) {
    let { name } = firstNumericParamSpec;
    result.params[name] = expression;
  }
  return result;
};

// TODO: use returnType to filter available expression types
const InspectorExpressionInput = ({
  label,
  behaviors,
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

  const onSwapParams = React.useCallback(
    (firstParamIndex) => {
      const spec1 = expressionParamSpecs[firstParamIndex];
      const spec2 = expressionParamSpecs[firstParamIndex + 1];
      const val1 = value.params[spec1.name];
      const val2 = value.params[spec2.name];
      onChange({
        ...value,
        params: {
          ...value.params,
          [spec1.name]: val2,
          [spec2.name]: val1,
        },
      });
      incrementLastNativeUpdate();
    },
    [expressionParamSpecs, value]
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
            value={value}
            onChange={onChange}
            behaviors={behaviors}
            showBehaviorPropertyPicker={showBehaviorPropertyPicker}
            triggerFilter={triggerFilter}
            style={styles.paramContainer}
          />
        ) : (
          expressionParamSpecs.map((spec, ii) => {
            const { name } = spec;
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
                      <Text style={styles.paramLabel}>{name}</Text>
                    </View>
                  ) : null}
                  <ParamInput
                    entryPath={`Expression.${expressionType}.${name}`}
                    label={spec.name}
                    name={name}
                    paramSpec={spec}
                    style={styles.paramInput}
                    value={paramValue}
                    setValue={setValue}
                    expressions={expressions}
                    onConfigureExpression={onConfigureExpression}
                    lastNativeUpdate={lastNativeUpdate}
                  />
                </View>
                {expressionParamSpecs.length == 2 && ii < expressionParamSpecs.length - 1 ? (
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
  spec.paramSpecs.filter(
    (paramSpec) => paramSpec.method === 'numberInput' && paramSpec.expression !== false
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
  const rulesData = useCoreState('EDITOR_RULES_DATA');
  let expressions;
  if (rulesData) {
    expressions = rulesData.expressions;
  }
  const behaviors = useCoreState('EDITOR_ALL_BEHAVIORS');
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
              expressions,
              expression: value,
              wrappingType,
            })
          ),
      }),
    [value, expressions]
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
        behaviors,
        useAllBehaviors: useAllBehaviors || childUseAllBehaviors,
        isPropertyVisible: (spec) => spec?.rules?.get === true,
        onSelectBehaviorProperty,
      });
    },
    [behaviors, useAllBehaviors]
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
        behaviors={behaviors}
        expressions={expressions}
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
