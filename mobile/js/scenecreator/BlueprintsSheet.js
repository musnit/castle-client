import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { sendDataPaneAction, ToolImage } from '../Tools';

import BottomSheetHeader from './BottomSheetHeader';
import CardCreatorBottomSheet from './CardCreatorBottomSheet';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  itemContainer: {
    borderRadius: 3,
    borderColor: '#ccc',
    borderWidth: 1,
    borderBottomWidth: 2,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
  },
  preview: {
    width: 64,
    height: 64,
    backgroundColor: '#ddd',
    borderRadius: 3,
    marginRight: 16,
    flexShrink: 0,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 56, // unclear why these need to be 8 pixels smaller than the container
    height: 56,
  },
});

const BlueprintItem = ({ entry, context, onPress }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <View style={styles.preview}>
      {entry.actorBlueprint?.components?.Drawing?.url ? (
        <ToolImage
          element={{}}
          path={entry.actorBlueprint?.components.Drawing.url}
          context={context}
          style={styles.image}
        />
      ) : null}
    </View>
    <View style={{ flexShrink: 1 }}>
      <Text style={styles.title}>{entry.title}</Text>
      <Text>{entry.description}</Text>
    </View>
  </TouchableOpacity>
);

export default BlueprintsSheet = ({ element, isOpen, onClose, onSelectBlueprint, context }) => {
  if (!element) {
    return null;
  }

  let blueprintsData, sendAction;
  if (element.children.count) {
    Object.entries(element.children).forEach(([key, child]) => {
      if (child.type === 'data') {
        const data = child.props.data;
        blueprintsData = data;
        sendAction = (action, value) => sendDataPaneAction(element, action, value, key);
      }
    });
  }

  if (!onSelectBlueprint) {
    onSelectBlueprint = (entryId) => sendAction('addBlueprintToScene', entryId);
  }

  const renderHeader = () => <BottomSheetHeader title="Blueprints" onClose={onClose} />;

  const renderContent = () => (
    <View style={styles.container}>
      {Object.entries(blueprintsData.library).map(([entryId, entry], ii) => {
        if (entry.entryType === 'actorBlueprint') {
          return (
            <BlueprintItem
              key={`blueprint-item-${ii}`}
              entry={entry}
              context={context}
              onPress={() => {
                onSelectBlueprint(entry.entryId);
                onClose();
              }}
            />
          );
        } else return null;
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
