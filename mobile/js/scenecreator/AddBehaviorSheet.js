import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheetHeader from './BottomSheetHeader';
import CardCreatorBottomSheet from './CardCreatorBottomSheet';

const styles = StyleSheet.create({
  container: {},
  group: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  groupLabel: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  addButton: {
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 3,
    padding: 16,
    marginBottom: 16,
  },
});

const BEHAVIOR_GROUPS = [
  {
    label: 'Collisions',
    behaviors: ['Solid', 'Bouncy', 'Friction'],
  },
  {
    // TODO: map to components, not behaviors, so that we can reference AxisLock component
    label: 'Physics',
    behaviors: ['Falling', 'SpeedLimit', 'Slowdown'],
  },
  {
    label: 'Controls',
    behaviors: ['Drag', 'Sling'],
  },
];

const AddBehavior = ({ behavior, onAdd }) => {
  if (!behavior || behavior.isActive) {
    // already added
    return null;
  }

  // TODO: disable/enable based on body constraints
  return (
    <TouchableOpacity style={styles.addButton} onPress={onAdd}>
      <Text>{behavior.name}</Text>
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
      {BEHAVIOR_GROUPS.map((group, ii) => (
        <View key={`group-${ii}`} style={styles.group}>
          <Text style={styles.groupLabel}>{group.label}</Text>
          {group.behaviors.map((key, jj) => (
            <AddBehavior
              key={`add-behavior-${key}`}
              behavior={behaviors[key]}
              onAdd={() => onPressAdd(key)}
            />
          ))}
        </View>
      ))}
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
