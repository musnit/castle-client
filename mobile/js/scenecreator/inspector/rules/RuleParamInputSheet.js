import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { ConfigureExpressionSheet } from '../expressions/ConfigureExpressionSheet';
import { getRuleRenderContext } from './RuleRenderContext';
import { RuleParamInputRow } from '../components/RuleParamInputRow';

import * as Constants from '../../../Constants';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  descriptionText: {
    fontSize: 16,
  },
  inputs: {
    paddingTop: 16,
  },
  inputRow: {
    borderWidth: 1,
    borderRadius: 6,
    borderColor: Constants.colors.black,
    backgroundColor: '#fff',
    ...Constants.styles.dropShadow,
  },
});

const EMPTY_PARAMSPEC = {
  type: 'f',
  initialValue: 0,
};

export default RuleParamInputSheet = ({
  title,
  entry,
  triggerFilter,
  onChangeParams,
  paramNames,
  initialValues,
  useAllBehaviors = false,
  isOpen,
  onClose,
  addChildSheet,
}) => {
  const context = getRuleRenderContext();
  const entryPathPrefix = `${entry.behaviorName}.entries.${entry.name}`;

  const findParamSpec = (paramName) => {
    if (paramName && entry.paramSpecs) {
      const result = entry.paramSpecs.find((s) => s.name === paramName);
      if (result) {
        return result;
      }
    }
    return EMPTY_PARAMSPEC;
  };

  const [values, changeValues] = React.useReducer(
    (state, action) => ({
      ...state,
      [action.paramName]: action.value,
    }),
    paramNames.reduce((values, paramName) => {
      let initialValue = initialValues[paramName];
      let paramSpec = findParamSpec(paramName);
      values[paramName] = initialValue === undefined ? paramSpec.initialValue : initialValue;
      return values;
    }, {})
  );

  const onConfigureExpression = ({ paramSpec, value, onChange }) => {
    addChildSheet({
      key: 'configureExpression',
      Component: ConfigureExpressionSheet,
      label: paramSpec.attribs?.label ?? paramSpec.name,
      triggerFilter,
      value,
      onChange,
      useAllBehaviors,
    });
  };

  const renderContent = () => (
    <View style={styles.container}>
      <View style={styles.description}>
        <Text style={styles.descriptionText}>{entry.description}</Text>
      </View>
      {paramNames.map((paramName, ii) => {
        const paramSpec = findParamSpec(paramName);
        const value = values[paramName];
        const setValue = (value) => changeValues({ paramName, value });
        const entryPath = `${entryPathPrefix}.${paramName}`;
        return (
          <View key={`param-${ii}`} style={styles.inputs}>
            <RuleParamInputRow
              entryPath={entryPath}
              label={paramSpec.attribs?.label ?? paramSpec.name}
              context={context}
              paramSpec={paramSpec}
              value={value}
              setValue={setValue}
              style={styles.inputRow}
              onConfigureExpression={() =>
                onConfigureExpression({ paramSpec, value, onChange: setValue })
              }
            />
          </View>
        );
      })}
    </View>
  );

  const onDone = React.useCallback(() => {
    onChangeParams(values);
    onClose();
  }, [onChangeParams, onClose, paramNames, values]);

  if (!title) {
    let firstParamName = paramNames[0];
    let paramSpec = findParamSpec(paramNames[0]);
    if (paramSpec && paramSpec.attribs?.label) {
      firstParamName = paramSpec.attribs.label;
    }
    title = `Edit ${firstParamName}`;
  }

  const renderHeader = () => <BottomSheetHeader title={title} onClose={onClose} onDone={onDone} />;

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
