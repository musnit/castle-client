import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { InspectorDropdown } from './InspectorDropdown';
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

const ExpressionInput = ({ value, onChange }) => {
  const expressionType = value.expressionType ?? 'number';

  return (
    <View style={styles.expressionTypeRow}>
      <Text style={styles.description}>Type</Text>
      <InspectorDropdown value={expressionType} items={['number', 'random']} onChange={() => {}} />
    </View>
  );
};

export const ConfigureExpressionSheet = ({
  paramSpec,
  value: initialValue,
  onChange,
  isOpen,
  onClose,
}) => {
  const [value, setValue] = React.useState(initialValue);

  const renderContent = () => (
    <View style={styles.container}>
      <ExpressionInput value={value} onChange={setValue} />
    </View>
  );

  const onDone = React.useCallback(() => {
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
