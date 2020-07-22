import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheetHeader from '../../BottomSheetHeader';
import CardCreatorBottomSheet from '../../CardCreatorBottomSheet';
import * as Inspector from '../behaviors/InspectorBehaviors';
import * as Constants from '../../../Constants';

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
    color: Constants.colors.grayText,
  },
  group: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  groupHeading: {
    flexDirection: 'row',
  },
  groupLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
  },
  addButton: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    marginTop: 8,
    paddingTop: 16,
  },
  addButtonLabel: {
    fontSize: 16,
    paddingBottom: 8,
  },
});

const Behavior = ({ isFirst, behavior, onAdd }) => {
  if (!behavior) {
    return null;
  }

  return (
    <TouchableOpacity style={isFirst ? null : styles.addButton} onPress={onAdd}>
      <Text style={styles.addButtonLabel}>{behavior.displayName}</Text>
    </TouchableOpacity>
  );
};

const EmptyState = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyStateLabel}>There are no behaviors left to add.</Text>
  </View>
);

export const SelectBehaviorSheet = ({
  isOpen,
  onClose,
  context,
  behaviors,
  filterBehavior,
  onSelectBehavior,
}) => {
  if (!filterBehavior) {
    filterBehavior = (behavior) => behaviors[behavior].isActive;
  }
  const onPressAdd = (key) => {
    onSelectBehavior(behaviors[key]);
    onClose();
  };
  const renderHeader = () => <BottomSheetHeader title="Select a behavior" onClose={onClose} />;

  let isSheetEmpty = true;
  let isGroupVisible = {};
  Inspector.MotionBehaviors.forEach((group) => {
    isGroupVisible[group.label] = group.behaviors.some((key) => filterBehavior(behaviors[key]));
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
            let index = 0;
            return (
              <View key={`group-${ii}`} style={styles.group}>
                <View style={styles.groupHeading}>
                  <Text style={styles.groupLabel}>{group.label}</Text>
                </View>
                {group.behaviors.map((key, jj) =>
                  filterBehavior(behaviors[key]) ? (
                    <Behavior
                      key={`add-behavior-${key}`}
                      behavior={behaviors[key]}
                      onAdd={() => onPressAdd(key)}
                      isFirst={index++ == 0}
                    />
                  ) : null
                )}
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
