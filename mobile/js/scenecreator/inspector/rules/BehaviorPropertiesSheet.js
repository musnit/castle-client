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

const Property = ({ isFirst, name, onSelect }) => {
  return (
    <TouchableOpacity style={isFirst ? null : styles.addButton} onPress={onSelect}>
      <Text style={styles.addButtonLabel}>{name}</Text>
    </TouchableOpacity>
  );
};

export const BehaviorPropertiesSheet = ({
  behaviors,
  onSelectBehaviorProperty,
  isOpen,
  onClose,
}) => {
  const onSelect = (behaviorName, propertyName) => {
    onSelectBehaviorProperty(behaviorName, propertyName);
    onClose();
  };
  const renderHeader = () => <BottomSheetHeader title="Select property" onClose={onClose} />;

  const renderContent = () => (
    <View style={styles.container}>
      {behaviors
        ? Object.entries(behaviors).map(([behaviorName, behavior]) => {
            const properties = Object.keys(behavior.propertySpecs);
            return behavior.isActive ? (
              <View key={`behavior-${behavior.name}`} style={styles.category}>
                <Text style={styles.categoryLabel}>{behavior.displayName}</Text>
                {properties.map((propertyName, ii) => {
                  const property = behavior.propertySpecs[propertyName];
                  return (
                    <Property
                      key={`behavior-property-${ii}`}
                      name={property.label}
                      isFirst={ii == 0}
                      onSelect={() => onSelect(behavior.name, propertyName)}
                    />
                  );
                })}
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
