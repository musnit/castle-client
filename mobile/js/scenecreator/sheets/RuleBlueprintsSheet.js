import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from './CardCreatorBottomSheet';
import { useCoreState } from '../../core/CoreEvents';

import * as Constants from '../../Constants';

import FastImage from 'react-native-fast-image';
import Feather from 'react-native-vector-icons/Feather';

const styles = StyleSheet.create({
  container: {},
  itemContainer: {
    borderColor: Constants.colors.grayOnWhiteBorder,
    borderBottomWidth: 1,
    padding: 16,
    paddingRight: 0,
    flexDirection: 'row',
  },
  preview: {
    width: 64,
    height: 64,
    borderRadius: 3,
    marginRight: 16,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 22,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
  },
  image: {
    width: 64,
    height: 64,
  },
  copyButton: {
    padding: 16,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasteContainer: {
    justifyContent: 'center',
  },
  pasteButton: {
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: Constants.colors.black,
    borderRadius: 4,
    padding: 12,
    flexDirection: 'row',
  },
  pasteImage: {
    width: 42,
    height: 42,
  },
  pasteDescription: {
    paddingLeft: 12,
    justifyContent: 'center',
  },
  pasteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pasteSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
});

const CORE_BLUEPRINT_SORT_ORDER = ['Ball', 'Wall', 'Text box', 'Navigation button'];

const orderedEntries = (library, type = 'actorBlueprint') => {
  if (!library) return [];

  let entries = Object.entries(library).map(([entryId, entry]) => entry);
  entries = entries.filter((entry) => entry.entryType === type);
  entries = entries.sort((a, b) => {
    if (a.isCore !== b.isCore) {
      // sort all core entries after all custom entries
      return a.isCore ? 1 : -1;
    } else if (a.isCore && b.isCore) {
      // sort core entries according to prebaked order
      const aOrder = CORE_BLUEPRINT_SORT_ORDER.indexOf(a.title),
        bOrder = CORE_BLUEPRINT_SORT_ORDER.indexOf(b.title);
      if (aOrder !== -1 && bOrder !== -1) {
        return aOrder < bOrder ? -1 : 1;
      }
    }
    // sort all other entries alphabetically
    return a.title.localeCompare(b.title);
  });
  return entries;
};

const BlueprintItem = ({ entry, onPress, onPressCopy }) => {
  return (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
      <View style={[styles.preview, entry.base64Png ? null : { backgroundColor: '#ddd' }]}>
        {entry.base64Png ? (
          <FastImage
            source={{ uri: `data:image/png;base64,${entry.base64Png}` }}
            style={styles.image}
          />
        ) : null}
      </View>
      <View style={{ flexShrink: 1, width: '100%' }}>
        <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.description}>{entry.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const RuleBlueprintsSheet = ({ isOpen, onClose, title, onSelectBlueprint }) => {
  const blueprintsData = useCoreState('EDITOR_LIBRARY');

  const renderHeader = () => <BottomSheetHeader title={title ?? 'Blueprints'} onClose={onClose} />;

  const renderContent = () => (
    <View style={styles.container}>
      {!isOpen ? null : (
        <>
          {orderedEntries(blueprintsData?.library).map((entry, ii) => {
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
        </>
      )}
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
