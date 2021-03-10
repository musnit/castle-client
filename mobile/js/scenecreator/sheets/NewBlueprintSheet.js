import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';

import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import * as Constants from '../../Constants';
import * as GhostEvents from '../../ghost/GhostEvents';

import { CardCreatorBottomSheet } from './CardCreatorBottomSheet';
import * as Clipboard from '../LibraryEntryClipboard';
import { useGhostUI } from '../../ghost/GhostUI';

const styles = StyleSheet.create({
  container: {},
  itemContainer: {
    padding: 16,
    paddingVertical: 6,
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
  meta: {
    flexShrink: 1,
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
  sectionHeaderSeparator: {
    paddingTop: 10,
    borderColor: Constants.colors.grayOnWhiteBorder,
    borderBottomWidth: 1,
  },
  sectionHeaderText: {
    padding: 16,
    paddingBottom: 10,
    color: Constants.colors.grayText,
  },
});

const TemplateItem = ({ entry, onPress }) => {
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
      <View style={styles.meta}>
        <Text style={styles.title}>{entry.title}</Text>
        {!entry.isBlank ? <Text style={styles.description}>{entry.description}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const PasteFromClipboardSection = ({ onPress }) => {
  const entry = Clipboard.getLibraryEntryClipboard();

  const pasteBlueprint = React.useCallback(() => {
    Clipboard.pasteBlueprint(entry);
  }, [entry]);

  const { root } = useGhostUI();
  const numActorsUsingClipboardEntry = root?.panes['sceneCreatorBlueprints'].children?.data?.props?.data?.numActorsUsingClipboardEntry || 0;

  if (!entry) {
    return null;
  }

  return (
    <>
      <View style={styles.sectionHeaderSeparator} />
      <Text style={styles.sectionHeaderText}>PASTE FROM CLIPBOARD</Text>
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          pasteBlueprint();
          onPress();
        }}>
        <View style={[styles.preview, entry.base64Png ? null : { backgroundColor: '#ddd' }]}>
          {entry.base64Png ? (
            <FastImage
              source={{ uri: `data:image/png;base64,${entry.base64Png}` }}
              style={styles.image}
            />
          ) : null}
        </View>
        <View style={styles.meta}>
          <Text style={styles.title}>{entry.title}</Text>
          {numActorsUsingClipboardEntry ? (
            <Text style={styles.description}>
              Overrides {numActorsUsingClipboardEntry}{' '}
              {numActorsUsingClipboardEntry === 1 ? 'actor' : 'actors'} in this card
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </>
  );
};

export const NewBlueprintSheet = ({ element, isOpen, onClose }) => {
  const data = element?.children?.data?.props?.data?.templates.map((entry, i) => ({
    index: i,
    entry,
  }));
  if (!data) {
    return null;
  }
  const blanks = data.filter(({ entry }) => entry.isBlank);
  const templates = data.filter(({ entry }) => !entry.isBlank);

  const renderHeader = () => <BottomSheetHeader title="Add a new blueprint" onClose={onClose} />;

  const renderContent = () => {
    if (!isOpen) {
      return <View style={styles.container} />;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.sectionHeaderText}>CREATE A BLANK BLUEPRINT</Text>
        {blanks.map(({ entry, index }) => {
          if (entry.entryType === 'actorBlueprint') {
            return (
              <TemplateItem
                key={index}
                entry={entry}
                onPress={() => {
                  GhostEvents.sendAsync('NEW_BLUEPRINT', { templateIndex: index });
                  onClose();
                }}
              />
            );
          }
        })}
        <PasteFromClipboardSection onPress={onClose} />
        <View style={styles.sectionHeaderSeparator} />
        <Text style={styles.sectionHeaderText}>START FROM A TEMPLATE</Text>
        {templates.map(({ entry, index }) => {
          if (entry.entryType === 'actorBlueprint') {
            return (
              <TemplateItem
                key={index}
                entry={entry}
                onPress={() => {
                  GhostEvents.sendAsync('NEW_BLUEPRINT', { templateIndex: index });
                  onClose();
                }}
              />
            );
          }
        })}
      </View>
    );
  };
  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
