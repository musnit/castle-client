import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from '../../components/BottomSheet';
import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import { sendAsync, useCoreState } from '../../core/CoreEvents';

import * as Constants from '../../Constants';
import * as CoreEvents from '../../core/CoreEvents';

import FastImage from 'react-native-fast-image';
import NewBlueprintSheetData from './NewBlueprintSheetData.json';
import tinycolor from 'tinycolor2';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  itemContainer: {
    padding: 16,
    paddingVertical: 12,
    flexDirection: 'row',
  },
  preview: {
    width: 64,
    height: 64,
    marginTop: 1,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flexShrink: 1,
    justifyContent: 'center',
  },
  pasteLabel: {
    textTransform: 'uppercase',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.5,
    color: Constants.colors.grayOnWhiteText,
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
    width: 56,
    height: 56,
  },
  sectionHeaderSeparator: {
    paddingTop: 4,
    marginBottom: 4,
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
        {/* {!entry.isBlank ? <Text style={styles.description}>{entry.description}</Text> : null} */}
        <Text style={styles.description}>{entry.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const PasteFromClipboardSection = ({ onPress }) => {
  React.useEffect(() => {
    sendAsync('REQUEST_BLUEPRINT_CLIPBOARD_DATA');
  }, []);
  const pasteBlueprint = React.useCallback(() => sendAsync('PASTE_BLUEPRINT', {}), []);

  const clipboard = useCoreState('EDITOR_BLUEPRINT_CLIPBOARD_DATA');
  let entry;
  try {
    if (clipboard?.entryJson) {
      entry = JSON.parse(clipboard.entryJson);
    }
  } catch (_) {}
  if (!entry) return null;

  return (
    <>
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
          <Text style={styles.pasteLabel}>Paste from clipboard</Text>
          <Text style={styles.title}>{entry.title}</Text>
          {clipboard.numActorsUsingEntry ? (
            <Text style={styles.description}>
              Overrides {clipboard.numActorsUsingEntry}{' '}
              {clipboard.numActorsUsingEntry === 1 ? 'actor' : 'actors'} in this card
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
      <View style={styles.sectionHeaderSeparator} />
    </>
  );
};

const entries = NewBlueprintSheetData.templates.map((entry, i) => ({
  index: i,
  entry,
}));

const textOptions = [
  {
    content: 'Bun',
    color: 'BB7547',
    fontName: 'Bore',
  },
  {
    content: 'Ketchup',
    color: 'B4202A',
    fontName: 'Compagnon',
  },
  {
    content: 'Mustard',
    color: 'FFD541',
    fontName: 'Glacier',
  },
  {
    content: 'Lettuce',
    color: '59C135',
    fontName: 'HelicoCentrica',
  },
  {
    content: 'Patty',
    color: '71413B',
    fontName: 'BreiteGrotesk',
  },
  {
    content: 'Cheese',
    color: 'FA6A0A',
    fontName: 'Synco',
  },
  {
    content: 'Onion',
    color: '793A80',
    fontName: 'YatraOne',
  },
  {
    content: 'Pickle',
    color: '34674E',
    fontName: 'Tektur',
  },
  {
    content: 'Tomato',
    color: 'DF3E23',
    fontName: 'Piazzolla',
  },
];

export const NewBlueprintSheet = ({ element, isOpen, onClose, ...props }) => {
  const blanks = entries.filter(({ entry }) => entry.isBlank);
  const templates = entries.filter(({ entry }) => !entry.isBlank);

  let textBlank = entries.find(({ entry }) => entry.isBlankText);

  let textChoice = textOptions[Math.floor(Math.random() * textOptions.length)];
  let colorChoice = tinycolor(textChoice.color).toRgb();
  colorChoice.r = colorChoice.r / 255.0;
  colorChoice.g = colorChoice.g / 255.0;
  colorChoice.b = colorChoice.b / 255.0;

  if (textBlank) {
    let textComponent = textBlank.entry.actorBlueprint.components.Text;
    textComponent.content = textChoice.content;
    textComponent.fontName = textChoice.fontName;
    textComponent.color = colorChoice;
  }

  const renderHeader = () => <BottomSheetHeader title="Add a blueprint" onClose={onClose} />;

  const renderContent = () => {
    if (!isOpen) {
      return <View style={styles.container} />;
    }

    return (
      <>
        {blanks.map(({ entry, index }) => {
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
        <View style={styles.sectionHeaderSeparator} />
        <PasteFromClipboardSection onPress={onClose} />
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
