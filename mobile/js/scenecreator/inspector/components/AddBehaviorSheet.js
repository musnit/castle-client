import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { useCoreState } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';

import Metadata from '../../Metadata';

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
  groupDisabled: {},
  groupLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 16,
  },
  groupLabelDisabled: {
    color: Constants.colors.grayText,
  },
  addButton: {
    borderWidth: 1,
    borderColor: Constants.colors.black,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    ...Constants.styles.dropShadow,
  },
  addButtonDisabled: {
    borderColor: Constants.colors.grayText,
    borderBottomWidth: 1,
  },
  addButtonLabel: {
    fontSize: 16,
  },
  addButtonLabelDisabled: {
    color: Constants.colors.grayText,
  },
  groupDisabledExplanation: {
    fontSize: 16,
    color: Constants.colors.grayText,
  },
});

const AddBehavior = ({ behavior, onAdd, disabled, isActive }) => {
  if (!behavior || isActive) {
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

export const AddBehaviorSheet = ({ isOpen, onClose, context, behaviors, addBehavior }) => {
  const selectedActorData = useCoreState('EDITOR_SELECTED_ACTOR');
  const onPressAdd = (key) => {
    addBehavior(key);
    onClose();
  };
  const renderHeader = () => <BottomSheetHeader title="Add a behavior" onClose={onClose} />;

  let isSheetEmpty = true;
  let isGroupVisible = {};
  Metadata.addMotionBehaviors.forEach((group) => {
    isGroupVisible[group.label] = group.behaviors.some(
      (behavior) => !selectedActorData.behaviors[behavior].isActive
    );
    if (isGroupVisible[group.label]) {
      isSheetEmpty = false;
    }
  });

  const renderContent = () =>
    isSheetEmpty ? (
      <EmptyState />
    ) : (
      <View style={styles.container}>
        {Metadata.addMotionBehaviors
          .filter((group) => isGroupVisible[group.label])
          .map((group, ii) => {
            let isGroupEnabled = true;
            if (
              group.dependencies.indexOf('Moving') !== -1 &&
              !selectedActorData.behaviors.Moving.isActive
            ) {
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
                      &nbsp;&ndash; requires dynamic motion
                    </Text>
                  ) : null}
                </View>
                {group.behaviors.map((key, jj) => (
                  <AddBehavior
                    key={`add-behavior-${key}`}
                    behavior={behaviors[key]}
                    isActive={selectedActorData.behaviors[behaviors[key].name].isActive}
                    onAdd={() => onPressAdd(key)}
                    disabled={!isGroupEnabled}
                  />
                ))}
              </View>
            );
          })}
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
