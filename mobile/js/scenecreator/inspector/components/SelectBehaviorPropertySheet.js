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

const Property = ({ isFirst, name, onSelect }) => {
  return (
    <TouchableOpacity style={styles.addButton} onPress={onSelect}>
      <Text style={styles.addButtonLabel}>{name}</Text>
    </TouchableOpacity>
  );
};

export const SelectBehaviorPropertySheet = ({
  behaviors,
  useAllBehaviors = false,
  onSelectBehaviorProperty,
  isOpen,
  onClose,
  isPropertyVisible = (propertySpec) => true,
}) => {
  const selectedActorData = useCoreState('EDITOR_SELECTED_ACTOR');
  const onSelect = (behaviorId, propertyName) => {
    onSelectBehaviorProperty(behaviorId, propertyName);
    onClose();
  };
  const renderHeader = () => <BottomSheetHeader title="Select property" onClose={onClose} />;

  // hide empty behaviors
  let isBehaviorVisible = {};
  Object.entries(behaviors).forEach(([behaviorName, behavior]) => {
    const properties = Object.keys(behavior.propertySpecs);
    isBehaviorVisible[behaviorName] =
      (useAllBehaviors || selectedActorData.behaviors[behavior.name].isActive) &&
      properties.some((name) => isPropertyVisible(behavior.propertySpecs[name]));
  });

  const renderContent = () => (
    <View style={styles.container}>
      {behaviors
        ? Object.entries(behaviors).map(([behaviorName, behavior]) => {
            const properties = Object.keys(behavior.propertySpecs);
            let index = 0;
            return isBehaviorVisible[behaviorName] ? (
              <View key={`behavior-${behavior.name}`} style={styles.category}>
                <Text style={styles.categoryLabel}>{behavior.displayName}</Text>
                {properties.map((propertyName, ii) => {
                  const property = behavior.propertySpecs[propertyName];
                  return isPropertyVisible(property) ? (
                    <Property
                      key={`behavior-property-${ii}`}
                      name={property.attribs.label}
                      isFirst={index++ == 0}
                      onSelect={() => onSelect(behavior.behaviorId, propertyName)}
                    />
                  ) : null;
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
