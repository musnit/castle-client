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
  context,
  entries,
  onSelectEntry,
  title,
}) => {
  const onPressAdd = (entry) => {
    onSelectEntry(entry);
    onClose();
  };
  const renderHeader = () => <BottomSheetHeader title={title} onClose={onClose} />;

  // filter by actor's behaviors, and hide empty sections
  let isCategoryVisible = {};
  Object.entries(entries).forEach(([category, contents]) => {
    isCategoryVisible[category] = contents.some((entry) => behaviors[entry.behaviorName]?.isActive);
  });

  const renderContent = () => (
    <View style={styles.container}>
      {entries
        ? Object.entries(entries).map(([category, contents]) =>
            isCategoryVisible[category] ? (
              <View key={`rule-category-${category}`} style={styles.category}>
                <Text style={styles.categoryLabel}>{category}</Text>
                {contents.map((entry, ii) =>
                  behaviors[entry.behaviorName]?.isActive ? (
                    <AddPart
                      key={`rule-entry-${ii}`}
                      entry={entry}
                      isFirst={ii == 0}
                      onAdd={onPressAdd}
                    />
                  ) : null
                )}
              </View>
            ) : null
          )
        : null}
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
