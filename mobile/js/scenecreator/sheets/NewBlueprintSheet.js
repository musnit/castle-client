import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import { CardCreatorBottomSheet } from './CardCreatorBottomSheet';
import * as Constants from '../../Constants';
import * as GhostEvents from '../../ghost/GhostEvents';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  container: {},
  itemContainer: {
    borderColor: Constants.colors.grayOnWhiteBorder,
    borderBottomWidth: 1,
    padding: 16,
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
});

const BlueprintItem = ({ entry, onPress }) => {
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
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.description}>{entry.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const NewBlueprintSheet = ({ element, isOpen, onClose }) => {
  const templates = element?.children?.data?.props?.data?.templates;
  if (!templates) {
    return null;
  }

  const renderHeader = () => <BottomSheetHeader title="Add a new blueprint" onClose={onClose} />;

  const renderContent = () => (
    <View style={styles.container}>
      {!isOpen
        ? null
        : templates.map((entry, i) => {
            if (entry.entryType === 'actorBlueprint') {
              return (
                <BlueprintItem
                  key={i}
                  entry={entry}
                  onPress={() => {
                    GhostEvents.sendAsync('NEW_BLUEPRINT', { templateIndex: i });
                    onClose();
                  }}
                />
              );
            }
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
