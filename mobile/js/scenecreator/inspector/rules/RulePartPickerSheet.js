import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheetHeader from '../../BottomSheetHeader';
import CardCreatorBottomSheet from '../../CardCreatorBottomSheet';

const styles = StyleSheet.create({
  container: {},
  category: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  categoryHeading: {
    flexDirection: 'row',
  },
  categoryLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 16,
    textTransform: 'capitalize',
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

const AddPart = ({ isFirst, entry, onAdd }) => {
  return (
    <TouchableOpacity style={isFirst ? null : styles.addButton} onPress={() => onAdd(entry)}>
      <Text style={styles.addButtonLabel}>{entry.description ?? entry.name}</Text>
    </TouchableOpacity>
  );
};

export default RulePartPickerSheet = ({
  behaviors,
  isOpen,
  onClose,
  entries,
  triggerFilter,
  onSelectEntry,
  title,
  categoryOrder = null,
}) => {
  const onPressAdd = (entry) => {
    onSelectEntry(entry);
    onClose();
  };
  const renderHeader = () => <BottomSheetHeader title={title} onClose={onClose} />;

  // filter by actor's behaviors, and by trigger if applicable
  const isEntryVisible = (entry) => {
    return (
      (!behaviors || behaviors[entry.behaviorName]?.isActive) &&
      (!entry.triggerFilter || entry.triggerFilter[triggerFilter])
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
                <Text style={styles.categoryLabel}>{category}</Text>
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
