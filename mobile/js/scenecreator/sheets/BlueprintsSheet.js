import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from './CardCreatorBottomSheet';
import { sendDataPaneAction } from '../../Tools';
import { useGhostUI } from '../../ghost/GhostUI';

import FastImage from 'react-native-fast-image';

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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  image: {
    width: 56,
    height: 56,
  },
});

const DEFAULT_BLUEPRINT_IMAGES = {
  Wall: require('../../../assets/images/add.png'),
  Ball: require('../../../assets/images/add.png'),
  Text: require('../../../assets/images/add.png'),
  Button: require('../../../assets/images/add.png'),
};

const BlueprintItem = ({ entry, onPress }) => {
  return (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
      <View style={styles.preview}>
        {DEFAULT_BLUEPRINT_IMAGES[entry.title] ? (
          <FastImage source={DEFAULT_BLUEPRINT_IMAGES[entry.title]} style={styles.image} />
        ) : null}
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.title}>{entry.title}</Text>
        <Text>{entry.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const BlueprintsSheet = ({ element, isOpen, onClose, title, onSelectBlueprint }) => {
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

  const renderHeader = () => <BottomSheetHeader title={title ?? 'Blueprints'} onClose={onClose} />;

  const renderContent = () => (
    <View style={styles.container}>
      {Object.entries(blueprintsData.library).map(([entryId, entry], ii) => {
        if (entry.entryType === 'actorBlueprint') {
          return (
            <BlueprintItem
              key={`blueprint-item-${ii}`}
              entry={entry}
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
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};

// needed when the blueprints sheet is used outside of the CardCreatorSheetManager root sheets
export const RuleBlueprintsSheet = (props) => {
  const { root } = useGhostUI();
  const element = root?.panes ? root.panes['sceneCreatorBlueprints'] : null;
  return <BlueprintsSheet {...props} element={element} />;
};
