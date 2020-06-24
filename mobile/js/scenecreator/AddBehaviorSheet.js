import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheetHeader from './BottomSheetHeader';
import CardCreatorBottomSheet from './CardCreatorBottomSheet';
import * as Inspector from './inspector/behaviors/InspectorBehaviors';

const styles = StyleSheet.create({
  container: {},
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
    marginBottom: 16,
  },
  groupLabelDisabled: {
    color: '#999',
  },
  addButton: {
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 3,
    padding: 16,
    marginBottom: 16,
  },
  addButtonDisabled: {
    borderColor: '#999',
  },
  addButtonLabel: {},
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
        {behavior.name}
      </Text>
    </TouchableOpacity>
  );
};

export default AddBehaviorSheet = ({ isOpen, onClose, context, behaviors, addBehavior }) => {
  const onPressAdd = (key) => {
    addBehavior(key);
    onClose();
  };
  const renderHeader = () => <BottomSheetHeader title="Add a behavior" onClose={onClose} />;
  const renderContent = () => (
    <View style={styles.container}>
      {Inspector.MotionBehaviors.map((group, ii) => {
        let isGroupEnabled = true;
        if (group.dependencies.indexOf('Moving') !== -1 && !behaviors.Moving.isActive) {
          // TODO: someday we may want a more general dependency check here
          isGroupEnabled = false;
        }
        return (
          <View key={`group-${ii}`} style={styles.group}>
            <View style={styles.groupHeading}>
              <Text style={[styles.groupLabel, !isGroupEnabled ? styles.groupLabelDisabled : null]}>
                {group.label}
              </Text>
              {!isGroupEnabled ? (
                <Text style={styles.groupDisabledExplanation}>&ndash; requires dynamic motion</Text>
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
