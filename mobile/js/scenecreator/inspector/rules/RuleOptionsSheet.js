import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import BottomSheetHeader from '../../BottomSheetHeader';
import CardCreatorBottomSheet from '../../CardCreatorBottomSheet';

const styles = StyleSheet.create({
  container: {},
  name: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  actions: {
    padding: 16,
  },
  actionContainer: {
    padding: 16,
  },
});

export default RuleOptionsSheet = ({
  title = 'Edit Response',
  entry,
  actions,
  onShowPicker,
  isOpen,
  onClose,
  context,
}) => {
  const items = [
    {
      name: 'Insert response before',
      shouldDisplay: () => true,
      action: () =>
        onShowPicker((result) => {
          actions.insertBefore(result);
          onClose();
        }),
    },
    {
      name: 'Move down in order',
      shouldDisplay: () => !!actions.moveDown,
      action: () => {
        actions.moveDown();
        onClose();
      },
    },
    {
      name: 'Wrap in condition',
      shouldDisplay: () => true,
      action: () => {
        actions.wrapInCondition();
        onClose();
      },
    },
    {
      name: 'Replace',
      shouldDisplay: () => true,
      action: () =>
        onShowPicker((result) => {
          actions.replace(result);
          onClose();
        }),
    },
    {
      name: 'Remove',
      shouldDisplay: () => true,
      action: () => {
        actions.remove();
        onClose();
      },
    },
  ];

  const renderContent = () => (
    <View style={styles.container}>
      {entry && (
        <View style={styles.description}>
          <Text style={styles.name}>"{entry.name}" response</Text>
          <Text>{entry.description}</Text>
        </View>
      )}
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
                <TouchableOpacity onPress={item.action}>
                  <Text>{item.name}</Text>
                </TouchableOpacity>
              </View>
            );
          }
          return null;
        })}
      </View>
    </View>
  );

  const renderHeader = () => <BottomSheetHeader title={title} onClose={onClose} />;

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      context={context}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
