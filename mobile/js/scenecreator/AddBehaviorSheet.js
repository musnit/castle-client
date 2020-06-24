import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheetHeader from './BottomSheetHeader';
import CardCreatorBottomSheet from './CardCreatorBottomSheet';
import * as Inspector from './inspector/behaviors/InspectorBehaviors';

const styles = StyleSheet.create({
  container: {},
  emptyState: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 128,
  },
  emptyStateLabel: {
    fontSize: 16,
    color: '#999',
  },
  group: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  groupHeading: {
    flexDirection: 'row',
  },
  groupDisabled: {},
  groupLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 16,
  },
  groupLabelDisabled: {
    color: '#999',
  },
  addButton: {
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  addButtonDisabled: {
    borderColor: '#999',
  },
  addButtonLabel: {
    fontSize: 16,
  },
  addButtonLabelDisabled: {
    color: '#999',
  },
  groupDisabledExplanation: {
    marginLeft: 8,
    color: '#999',
  },
});

const AddBehavior = ({ behavior, onAdd, disabled }) => {
  if (!behavior || behavior.isActive) {
    // already added
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.addButton, disabled ? styles.addButtonDisabled : null]}
      onPress={onAdd}
      disabled={disabled}>
      <Text style={[styles.addButtonLabel, disabled ? styles.addButtonLabelDisabled : null]}>
        {behavior.displayName}
      </Text>
    </TouchableOpacity>
  );
};

const EmptyState = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyStateLabel}>There are no behaviors left to add.</Text>
  </View>
);

export default AddBehaviorSheet = ({ isOpen, onClose, context, behaviors, addBehavior }) => {
  const onPressAdd = (key) => {
    addBehavior(key);
    onClose();
  };
  const renderHeader = () => <BottomSheetHeader title="Add a behavior" onClose={onClose} />;

  let isSheetEmpty = true;
  let isGroupVisible = {};
  Inspector.MotionBehaviors.forEach((group) => {
    isGroupVisible[group.label] = group.behaviors.some((behavior) => !behaviors[behavior].isActive);
    if (isGroupVisible[group.label]) {
      isSheetEmpty = false;
    }
  });

  const renderContent = () =>
    isSheetEmpty ? (
      <EmptyState />
    ) : (
      <View style={styles.container}>
        {Inspector.MotionBehaviors.filter((group) => isGroupVisible[group.label]).map(
          (group, ii) => {
            let isGroupEnabled = true;
            if (group.dependencies.indexOf('Moving') !== -1 && !behaviors.Moving.isActive) {
              // TODO: someday we may want a more general dependency check here
              isGroupEnabled = false;
            }
            return (
              <View key={`group-${ii}`} style={styles.group}>
                <View style={styles.groupHeading}>
                  <Text
                    style={[styles.groupLabel, !isGroupEnabled ? styles.groupLabelDisabled : null]}>
                    {group.label}
                  </Text>
                  {!isGroupEnabled ? (
                    <Text style={styles.groupDisabledExplanation}>
                      &ndash; requires dynamic motion
                    </Text>
                  ) : null}
                </View>
                {group.behaviors.map((key, jj) => (
                  <AddBehavior
                    key={`add-behavior-${key}`}
                    behavior={behaviors[key]}
                    onAdd={() => onPressAdd(key)}
                    disabled={!isGroupEnabled}
                  />
                ))}
              </View>
            );
          }
        )}
      </View>
    );

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      context={context}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
