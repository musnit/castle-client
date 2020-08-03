import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { RuleParamInputRow } from '../components/RuleParamInputRow';
import { useCardCreator } from '../../CreateCardContext';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  description: {
    paddingBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
  },
  inputs: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Constants.colors.grayOnWhiteBorder,
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
}) => {
  const context = useCardCreator();
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
        <Text style={styles.descriptionText}>{entry.description}</Text>
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

  if (!title) {
    let firstParamName = paramNames[0];
    let paramSpec = findParamSpec(paramNames[0]);
    if (paramSpec && paramSpec.label) {
      firstParamName = paramSpec.label;
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
