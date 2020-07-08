import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RuleParamInputRow } from '../components/RuleParamInputRow';

import BottomSheetHeader from '../../BottomSheetHeader';
import CardCreatorBottomSheet from '../../CardCreatorBottomSheet';

const styles = StyleSheet.create({
  container: {},
  description: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    padding: 16,
  },
  inputs: {
    padding: 16,
  },
});

const EMPTY_PARAMSPEC = {
  method: 'numberInput',
  initialValue: 0,
};

export default RuleParamInputSheet = ({
  title,
  entry,
  onChangeParams,
  paramNames,
  initialValues,
  isOpen,
  onClose,
  context,
}) => {
  const findParamSpec = (paramName) => {
    if (paramName && entry.paramSpecs && entry.paramSpecs[paramName]) {
      return entry.paramSpecs[paramName];
    } else {
      return EMPTY_PARAMSPEC;
    }
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

  const renderContent = () => (
    <View style={styles.container}>
      <View style={styles.description}>
        <Text>{entry.description}</Text>
      </View>
      {paramNames.map((paramName, ii) => (
        <View key={`param-${ii}`} style={styles.inputs}>
          <RuleParamInputRow
            label={paramName}
            context={context}
            paramSpec={findParamSpec(paramName)}
            value={values[paramName]}
            setValue={(value) => changeValues({ paramName, value })}
          />
        </View>
      ))}
    </View>
  );

  const onDone = React.useCallback(() => {
    onChangeParams(values);
    onClose();
  }, [onChangeParams, onClose, paramNames, values]);

  const renderHeader = () => <BottomSheetHeader title={title} onClose={onClose} onDone={onDone} />;

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      context={context}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
