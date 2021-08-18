import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';

import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import * as Constants from '../../Constants';
import * as CoreEvents from '../../core/CoreEvents';

import { BottomSheet } from '../../components/BottomSheet';
import * as Clipboard from '../LibraryEntryClipboard';
import { useGhostUI } from '../../ghost/GhostUI';

import NewBlueprintSheetData from './NewBlueprintSheetData.json';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  itemContainer: {
    padding: 16,
    paddingVertical: 8,
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
    backgroundColor: '#0001',
    padding: 8,
  },
  meta: {
    flexShrink: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 21,
  },
  description: {
    fontSize: 16,
    lineHeight: 21,
  },
  image: {
    width: 56,
    height: 56,
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
    textAlign: 'center',
  },
  blankSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  blankItemContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  blankImage: {
    width: 64,
    height: 64,
  },
  blankMeta: {
    marginTop: 8,
  },
  blankTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const TemplateItem = ({ entry, onPress }) => {
  return (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
      <View style={styles.preview}>
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

const BlankTemplateItem = ({ entry, onPress }) => {
  return (
    <TouchableOpacity style={styles.blankItemContainer} onPress={onPress}>
      {entry.base64Png ? (
        <FastImage
          source={{ uri: `data:image/png;base64,${entry.base64Png}` }}
          style={styles.blankImage}
        />
      ) : null}
      <View style={styles.blankMeta}>
        <Text style={styles.blankTitle}>{entry.title}</Text>
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
  const numActorsUsingClipboardEntry = 0;
  //const numActorsUsingClipboardEntry =
  //  root?.panes['sceneCreatorBlueprints'].children?.data?.props?.data
  //    ?.numActorsUsingClipboardEntry || 0;

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

const entries = NewBlueprintSheetData.templates.map((entry, i) => ({
  index: i,
  entry,
}));

export const NewBlueprintSheet = ({ element, isOpen, onClose, ...props }) => {
  const blanks = entries.filter(({ entry }) => entry.isBlank);
  const templates = entries.filter(({ entry }) => !entry.isBlank);

  const renderHeader = () => <BottomSheetHeader title="Add a new blueprint" onClose={onClose} />;

  const renderContent = () => {
    if (!isOpen) {
      return <View style={styles.container} />;
    }

    return (
      <>
        <Text style={styles.sectionHeaderText}>CREATE A BLANK BLUEPRINT</Text>
        <View style={styles.blankSection}>
          {blanks.map(({ entry, index }) => {
            if (entry.entryType === 'actorBlueprint') {
              return (
                <BlankTemplateItem
                  key={index}
                  entry={entry}
                  onPress={() => {
                    CoreEvents.sendAsync('EDITOR_NEW_BLUEPRINT', { entry });
                    onClose();
                  }}
                />
              );
            }
          })}
        </View>
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
                  CoreEvents.sendAsync('EDITOR_NEW_BLUEPRINT', { entry });
                  onClose();
                }}
              />
            );
          }
        })}
      </>
    );
  };
  return (
    <BottomSheet
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
      style={styles.container}
      {...props}
    />
  );
};
