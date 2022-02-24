import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from '../../../components/BottomSheet';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { sendAsync, useCoreState } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';
const { CastleIcon } = Constants;

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
    paddingVertical: 8,
    marginRight: 16,
    justifyContent: 'center',
  },
});

const TemplateItem = ({ entry, onPress }) => {
  return (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
      <View style={styles.image}>
        <CastleIcon name={entry.icon} size={32} color="#000" />
      </View>
      <View style={styles.meta}>
        <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.description}>{entry.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const entries = [
  {
    id: 'tone',
    icon: 'instrument-tone',
    title: 'Sampler: Tone',
    description: 'A synthesized musical tone',
  },
  {
    id: 'drums',
    icon: 'instrument-drum',
    title: 'Drums',
    description: 'A rhythmic instrument that can play a variety of drums',
  },
  {
    id: 'sfxr',
    icon: 'instrument-sfxr',
    title: 'Sampler: Generated Effect',
    description: 'A generated sound effect',
  },
  {
    id: 'microphone',
    icon: 'instrument-recording',
    title: 'Sampler: Recording',
    description: 'A sample recorded from my device microphone',
  },
  {
    id: 'library',
    icon: 'instrument-file',
    title: 'Sampler: File',
    description: 'A sample chosen from my file library',
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
