import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheetHeader from '../../../BottomSheetHeader';
import CardCreatorBottomSheet from '../../../CardCreatorBottomSheet';

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
  },
  addButton: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
  },
  addButtonLabel: {
    fontSize: 16,
    paddingBottom: 8,
  },
});

const AddPart = ({ isLast, entry, onAdd }) => {
  return (
    <TouchableOpacity style={isLast ? null : styles.addButton} onPress={onAdd}>
      <Text style={styles.addButtonLabel}>{entry.name}</Text>
    </TouchableOpacity>
  );
};

export default RulePartPickerSheet = ({ isOpen, onClose, context, entries }) => {
  const onPressAdd = (key) => {
    onClose();
  };
  const renderHeader = () => <BottomSheetHeader title="Select trigger" onClose={onClose} />;

  const renderContent = () => (
    <View style={styles.container}>
      {entries
        ? Object.entries(entries).map(([category, contents]) => (
            <View key={`rule-category-${category}`} style={styles.category}>
              <Text style={styles.categoryLabel}>{category}</Text>
              {contents.map((entry, ii) => (
                <AddPart
                  key={`rule-entry-${ii}`}
                  entry={entry}
                  isLast={ii == contents.length - 1}
                />
              ))}
            </View>
          ))
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
