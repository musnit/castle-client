import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { Rule } from './Rule';

import FeatherIcon from 'react-native-vector-icons/Feather';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -32,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
});

const RuleHeaderActions = ({ onRemoveRule, onCopyRule }) => {
  return (
    <View style={styles.actions}>
      <TouchableOpacity style={styles.actionButton} onPress={onCopyRule}>
        <FeatherIcon name="copy" size={22} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onRemoveRule}>
        <FeatherIcon name="trash-2" size={22} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

export const EditRuleSheet = ({
  rule,
  behaviors,
  triggers,
  responses,
  conditions,
  sendRuleAction,
  onChangeRule,
  onRemoveRule,
  onCopyRule,
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

  const onRemove = React.useCallback(() => {
    onRemoveRule(rule);
    onClose();
  }, [onRemoveRule, onClose, rule]);

  const onCopy = React.useCallback(() => {
    onCopyRule(value);
    onClose();
  }, [onCopyRule, onClose, value]);

  const renderHeaderActions = () => (
    <RuleHeaderActions onRemoveRule={onRemove} onCopyRule={onCopy} />
  );

  const renderHeader = () => (
    <BottomSheetHeader title="Edit Rule" onClose={onDone} renderActions={renderHeaderActions} />
  );

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
