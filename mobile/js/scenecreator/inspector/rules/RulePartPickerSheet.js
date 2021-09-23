import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { useCoreState } from '../../../core/CoreEvents';

const styles = StyleSheet.create({
  container: {},
  category: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  categoryHeading: {
    flexDirection: 'row',
  },
  categoryLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  addButton: {
    paddingVertical: 8,
  },
  addButtonLabel: {
    fontSize: 16,
    paddingBottom: 8,
  },
});

const AddPart = ({ isFirst, entry, onAdd }) => {
  return (
    <TouchableOpacity style={styles.addButton} onPress={() => onAdd(entry)}>
      <Text style={styles.addButtonLabel}>{entry.description ?? entry.name}</Text>
    </TouchableOpacity>
  );
};

export default RulePartPickerSheet = ({
  isOpen,
  onClose,
  entries,
  triggerFilter,
  onSelectEntry,
  title,
  useAllBehaviors,
  categoryOrder = null,
  parentType,
}) => {
  const selectedActorData = useCoreState('EDITOR_SELECTED_ACTOR');
  const onPressAdd = (entry) => {
    onSelectEntry(entry);
    onClose();
  };
  const renderHeader = () => <BottomSheetHeader title={title} onClose={onClose} />;

  // filter by actor's behaviors, and by trigger if applicable
  const isEntryVisible = (entry) => {
    return (
      (!selectedActorData ||
        useAllBehaviors ||
        selectedActorData.behaviors[entry.behaviorName]?.isActive) &&
      (!entry.triggerFilter || entry.triggerFilter[triggerFilter]) &&
      (!entry.parentTypeFilter || entry.parentTypeFilter[parentType])
    );
  };

  // hide empty sections
  let isCategoryVisible = {};
  Object.entries(entries).forEach(([category, contents]) => {
    isCategoryVisible[category] = contents.some((entry) => isEntryVisible(entry));
  });

  if (!categoryOrder && entries) {
    categoryOrder = Object.keys(entries);
  }
  const renderContent = () => (
    <View style={styles.container}>
      {entries
        ? categoryOrder.map((category) => {
            const contents = entries[category];
            let index = 0;
            return isCategoryVisible[category] ? (
              <View key={`rule-category-${category}`} style={styles.category}>
                <Text style={styles.categoryLabel}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                {contents.map((entry) =>
                  isEntryVisible(entry) ? (
                    <AddPart
                      key={`rule-entry-${index}`}
                      entry={entry}
                      isFirst={index++ == 0}
                      onAdd={onPressAdd}
                    />
                  ) : null
                )}
              </View>
            ) : null;
          })
        : null}
    </View>
  );

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
