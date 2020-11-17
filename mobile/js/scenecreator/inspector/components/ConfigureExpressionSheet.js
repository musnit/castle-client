import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { InspectorExpressionInput } from './InspectorExpressionInput';
import { useCardCreator } from '../../CreateCardContext';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  description: {
    fontSize: 16,
  },
});

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
      <InspectorExpressionInput expressions={expressions} value={value} onChange={setValue} />
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
