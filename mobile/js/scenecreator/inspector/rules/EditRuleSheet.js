import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { Rule } from './Rule';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});

export const EditRuleSheet = ({
  rule,
  behaviors,
  triggers,
  responses,
  conditions,
  sendRuleAction,
  onChangeRule,
  isOpen,
  onClose,
  addChildSheet,
}) => {
  const [value, setValue] = React.useState(rule);

  const renderContent = () => (
    <View style={styles.container}>
      <Rule
        rule={value}
        onChangeRule={setValue}
        addChildSheet={addChildSheet}
        behaviors={behaviors}
        triggers={triggers}
        responses={responses}
        conditions={conditions}
        sendRuleAction={sendRuleAction}
      />
    </View>
  );

  const onDone = React.useCallback(() => {
    onChangeRule(value);
    onClose();
  }, [onClose, value]);

  const renderHeader = () => (
    <BottomSheetHeader title="Edit Rule" onClose={onClose} onDone={onDone} />
  );

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
