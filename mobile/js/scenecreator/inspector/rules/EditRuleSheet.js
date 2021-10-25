import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { Rule } from './Rule';
import { useCoreState } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';
const CastleIcon = Constants.CastleIcon;

const styles = StyleSheet.create({
  container: {},
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
        <CastleIcon name="clipboard" size={22} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onRemoveRule}>
        <CastleIcon name="trash" size={22} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

export const EditRuleSheet = ({
  ruleIndex,
  behaviors,
  triggers,
  responses,
  conditions,
  onChangeRule,
  onRemoveRule,
  onCopyRule,
  isOpen,
  onClose,
  addChildSheet,
}) => {
  const rulesComponent = useCoreState('EDITOR_SELECTED_COMPONENT:Rules');
  const rule = rulesComponent ? rulesComponent.rules[ruleIndex] : null;
  if (!rule) return null;

  const renderContent = () => (
    <View style={styles.container}>
      <Rule
        rule={rule}
        onChangeRule={(newRule) => onChangeRule(newRule, ruleIndex)}
        addChildSheet={addChildSheet}
        behaviors={behaviors}
        triggers={triggers}
        responses={responses}
        conditions={conditions}
      />
    </View>
  );

  const onRemove = React.useCallback(() => {
    onRemoveRule(rule, ruleIndex);
    onClose();
  }, [onRemoveRule, onClose, rule, ruleIndex]);

  const onCopy = React.useCallback(() => {
    onCopyRule(rule);
    onClose();
  }, [onCopyRule, onClose, rule]);

  const renderHeaderActions = () => (
    <RuleHeaderActions onRemoveRule={onRemove} onCopyRule={onCopy} />
  );

  const renderHeader = () => (
    <BottomSheetHeader title="Edit Rule" onClose={onClose} renderActions={renderHeaderActions} />
  );

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
