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
  paramName,
  initialValue,
  onChangeParam,
  isOpen,
  onClose,
  context,
}) => {
  let paramSpec;
  if (paramName && entry.paramSpecs && entry.paramSpecs[paramName]) {
    paramSpec = entry.paramSpecs[paramName];
  } else {
    paramSpec = EMPTY_PARAMSPEC;
  }

  let [value, setValue] = React.useState(
    initialValue === undefined ? paramSpec.initialValue : initialValue
  );

  const renderContent = () => (
    <View style={styles.container}>
      <View style={styles.description}>
        <Text>{entry.description}</Text>
      </View>
      <View style={styles.inputs}>
        <RuleParamInputRow
          label={paramName}
          paramSpec={paramSpec}
          value={value}
          setValue={setValue}
        />
      </View>
    </View>
  );

  const onDone = React.useCallback(() => {
    onChangeParam(paramName, value);
    onClose();
  }, [onChangeParam, onClose, paramName, value]);

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
