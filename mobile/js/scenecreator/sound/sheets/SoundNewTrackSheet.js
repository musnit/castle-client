import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from '../../../components/BottomSheet';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { sendAsync, useCoreState } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';

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
    width: 56,
    height: 56,
  },
});

const TemplateItem = ({ entry, onPress }) => {
  return (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
      <View style={styles.meta}>
        <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.description}>{entry.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const entries = [
  {
    id: 'sampler',
    title: 'Sampler',
    description:
      'A melodic instrument that can play a tone, a recorded clip, or a generated effect',
  },
  {
    id: 'drums',
    title: 'Drums',
    description: 'A rhythmic instrument that can play a variety of drums',
  },
];

export const SoundNewTrackSheet = ({ element, isOpen, onClose, ...props }) => {
  const renderHeader = () => <BottomSheetHeader title="Add a track" onClose={onClose} />;

  const renderContent = () => {
    if (!isOpen) {
      return <View style={styles.container} />;
    }

    return (
      <>
        {entries.map((entry, index) => {
          return (
            <TemplateItem
              key={index}
              entry={entry}
              onPress={() => {
                sendAsync('EDITOR_SOUND_TOOL_ADD_TRACK', { type: entry.id });
                onClose();
              }}
            />
          );
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
