import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { InspectorExpressionInput } from './InspectorExpressionInput';
import { promoteToExpression } from '../../SceneCreatorUtilities';
import { useCardCreator } from '../../CreateCardContext';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  description: {
    fontSize: 16,
  },
});

export const ConfigureExpressionSheet = ({
  paramSpec,
  value: initialValue,
  onChange,
  isOpen,
  onClose,
}) => {
  const createCardContext = useCardCreator();
  const [value, setValue] = React.useState(promoteToExpression(initialValue));

  const renderContent = () => (
    <View style={styles.container}>
      <InspectorExpressionInput
        context={createCardContext}
        expressions={createCardContext.expressions}
        value={value}
        onChange={setValue}
      />
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
