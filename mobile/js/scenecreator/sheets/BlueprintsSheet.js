import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from './CardCreatorBottomSheet';

import * as Clipboard from '../LibraryEntryClipboard';
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

const BlueprintItem = ({ entry, onPress, isRule, onPressCopy }) => {
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
      {!entry.isCore && !isRule ? (
        <TouchableOpacity style={styles.copyButton} onPress={() => onPressCopy(entry.entryId)}>
          <Feather name="copy" size={24} color="#000" />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
};

const PasteFromClipboardRow = ({ onPaste, numActorsUsingClipboardEntry }) => {
  const entry = Clipboard.getLibraryEntryClipboard();
  if (!entry) return null;
  return (
    <TouchableOpacity
      style={[styles.itemContainer, styles.pasteContainer]}
      onPress={() => onPaste(entry)}>
      <View style={styles.pasteButton}>
        <View style={entry.base64Png ? null : { backgroundColor: '#ddd' }}>
          {entry.base64Png ? (
            <FastImage
              source={{ uri: `data:image/png;base64,${entry.base64Png}` }}
              style={styles.pasteImage}
            />
          ) : null}
        </View>
        <View style={styles.pasteDescription}>
          <Text style={styles.pasteTitle}>Paste {entry.title}</Text>
          {numActorsUsingClipboardEntry ? (
            <Text style={styles.pasteSubtitle}>
              Overrides {numActorsUsingClipboardEntry}{' '}
              {numActorsUsingClipboardEntry === 1 ? 'actor' : 'actors'} in this card
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const BlueprintsSheet = ({ element, isOpen, onClose, title, onSelectBlueprint, isRule }) => {
  // TODO: restore
  const blueprintsData = {};
  const sendAction = () => {};

  if (!onSelectBlueprint) {
    onSelectBlueprint = (entryId) => sendAction('addBlueprintToScene', entryId);
  }

  const copyBlueprint = React.useCallback(
    (entryId) => {
      const library = blueprintsData?.library;
      if (library) {
        const entry = library[entryId];
        Clipboard.setLibraryEntryAsClipboard(entry);
        onClose();
      }
    },
    [blueprintsData, onClose]
  );

  const pasteBlueprint = React.useCallback(
    (entry) => {
      sendAction('pasteBlueprint', entry);
      onClose();
    },
    [sendAction, onClose]
  );

  const renderHeader = () => <BottomSheetHeader title={title ?? 'Blueprints'} onClose={onClose} />;

  const renderContent = () => (
    <View style={styles.container}>
      {!isOpen ? null : (
        <>
          {!isRule ? (
            <PasteFromClipboardRow
              onPaste={pasteBlueprint}
              numActorsUsingClipboardEntry={blueprintsData?.numActorsUsingClipboardEntry}
            />
          ) : null}
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
                  onPressCopy={copyBlueprint}
                  isRule={isRule}
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

// needed when the blueprints sheet is used outside of the CardCreatorSheetManager root sheets
export const RuleBlueprintsSheet = (props) => {
  // TODO: provide data
  // const element = root?.panes ? root.panes['sceneCreatorBlueprints'] : null;
  const element = {};
  return <BlueprintsSheet {...props} element={element} isRule />;
};
