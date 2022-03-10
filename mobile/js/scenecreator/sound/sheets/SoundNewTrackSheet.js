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
  group: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: Constants.colors.grayOnWhiteBorder,
  },
  itemContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
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

const groupedEntries = [
  {
    id: 'empty',
    label: 'Instruments',
    entries: [
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
    ],
  },
  {
    id: 'presets',
    label: 'Presets',
    entries: [
      {
        id: 'drums-simple-beat',
        icon: 'instrument-drum',
        title: 'Simple Beat',
        preset: 'simple beat',
        description: 'A simple beat',
      },
      {
        id: 'drums-techno',
        icon: 'instrument-drum',
        title: 'Techno',
        preset: 'techno',
        description: 'A dancey beat',
      },
      {
        id: 'drums-house',
        icon: 'instrument-drum',
        title: 'More techno',
        preset: 'techno2',
        description: 'A different dancey beat',
      },
      {
        id: 'drums-slow',
        icon: 'instrument-drum',
        title: '808 bass',
        preset: 'slow',
        description: `Slow 808-ish beat with heavy sub-bass`,
      },
      {
        id: 'drums-dnb',
        icon: 'instrument-drum',
        title: 'Drum and Bass',
        preset: 'dnb',
        description: 'Higher clock bpm recommended',
      },
      {
        id: 'sampler-8-bit',
        icon: 'instrument-sfxr',
        title: '8-bit Beat',
        preset: '8-bit beat',
        description: 'A lo-fi beat made from subnoise',
      },
      {
        id: 'sampler-square',
        icon: 'instrument-tone',
        title: 'Square Bass',
        preset: 'square bass',
        description: 'A melodic bass synth',
      },
      {
        id: 'sampler-prelude',
        icon: 'instrument-tone',
        title: 'Prelude',
        preset: 'prelude',
        description: 'An example of a famous melody',
      },
    ],
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
        {groupedEntries.map((group) => (
          <View style={styles.group} key={`group-${group.id}`}>
            <View style={styles.groupHeading}>
              <Text style={styles.title}>{group.label}</Text>
            </View>
            {group.entries.map((entry) => {
              return (
                <TemplateItem
                  key={`entry-${entry.id}`}
                  entry={entry}
                  onPress={() => {
                    sendAsync('EDITOR_SOUND_TOOL_ADD_TRACK', {
                      type: entry.id,
                      presetName: entry.preset || '',
                    });
                    onClose();
                  }}
                />
              );
            })}
          </View>
        ))}
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
