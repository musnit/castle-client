import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';

const styles = StyleSheet.create({
  container: {},
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  description: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  actions: {
    paddingHorizontal: 16,
  },
  actionContainer: {
    padding: 12,
    paddingLeft: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  actionLabel: {
    fontSize: 16,
  },
});

export default RuleOptionsSheet = ({
  type = 'response',
  entry,
  actions,
  onShowPicker,
  isOpen,
  onClose,
}) => {
  let items;
  if (type === 'rule') {
    items = [
      {
        name: 'Copy',
        icon: 'content-copy',
        shouldDisplay: () => true,
        action: () => {
          actions.copy();
          onClose();
        },
      },
      {
        name: 'Remove',
        icon: 'trash-can',
        shouldDisplay: () => true,
        action: () => {
          actions.remove();
          onClose();
        },
      },
    ];
  } else if (type === 'response') {
    items = [
      {
        name: 'Insert response before',
        icon: 'table-row-plus-before',
        shouldDisplay: () => true,
        action: () =>
          onShowPicker((result) => {
            actions.insertBefore(result);
            onClose();
          }),
      },
      {
        name: 'Move down in order',
        icon: 'arrow-down',
        shouldDisplay: () => !!actions.moveDown,
        action: () => {
          actions.moveDown();
          onClose();
        },
      },
      {
        name: 'Wrap in condition',
        icon: 'code-braces',
        shouldDisplay: () => true,
        action: () => {
          actions.wrapInCondition();
          onClose();
        },
      },
      {
        name: 'Repeat N times',
        icon: 'repeat-once',
        shouldDisplay: () => true,
        action: () => {
          actions.wrapInRepeat();
          onClose();
        },
      },
      {
        name: 'Repeat every N seconds',
        icon: 'clock-outline',
        shouldDisplay: () => true,
        action: () => {
          actions.wrapInInfiniteRepeat();
          onClose();
        },
      },
      {
        name: 'Replace',
        icon: 'swap-horizontal',
        shouldDisplay: () => true,
        action: () =>
          onShowPicker((result) => {
            actions.replace(result);
            onClose();
          }),
      },
      {
        name: 'Remove',
        icon: 'trash-can',
        shouldDisplay: () => true,
        action: () => {
          actions.remove();
          onClose();
        },
      },
    ];
  }

  const renderContent = () => (
    <View style={styles.container}>
      <View style={styles.actions}>
        {items.map((item, ii) => {
          if (item.shouldDisplay()) {
            return (
              <View
                key={`action-${ii}`}
                style={[
                  styles.actionContainer,
                  ii > 0 ? { borderTopWidth: 1, borderColor: '#ccc' } : null,
                ]}>
                <TouchableOpacity onPress={item.action} style={styles.actionButton}>
                  <MCIcon name={item.icon} color="#000" size={24} style={styles.icon} />
                  <Text style={styles.actionLabel}>{item.name}</Text>
                </TouchableOpacity>
              </View>
            );
          }
          return null;
        })}
      </View>
    </View>
  );

  const title = type === 'response' ? 'Edit Response' : 'Edit Rule';
  const renderHeader = () => <BottomSheetHeader title={title} onClose={onClose} />;

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
      snapPoints={[100, 450]}
    />
  );
};
