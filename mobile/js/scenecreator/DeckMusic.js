import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { InspectorNumberInput } from './inspector/components/InspectorNumberInput';
import { InspectorTextInput } from './inspector/components/InspectorTextInput';
import { useCoreState, sendAsync } from '../core/CoreEvents';

import FeatherIcon from 'react-native-vector-icons/Feather';

import 'react-native-get-random-values'; // required for uuid
import { v4 as uuidv4 } from 'uuid';

import * as SceneCreatorConstants from './SceneCreatorConstants';
import * as Constants from '../Constants';

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  songInputContainer: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: Constants.iOS ? 12 : 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  songName: {
    flexGrow: 1,
    fontWeight: '700',
    marginRight: 16,
  },
  input: {
    color: '#000',
    fontSize: 16,
    lineHeight: 20,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  label: {
    width: '33%',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
    color: '#888',
  },
  actions: {
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    ...SceneCreatorConstants.styles.button,
  },
  buttonLabel: {
    ...SceneCreatorConstants.styles.buttonLabel,
  },
});

const SongInput = ({ name, type, autoFocus, onChange, onDelete, onEdit, ...props }) => {
  const { songId } = props;
  return (
    <View style={styles.songInputContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', width: '50%' }}>
        <Text style={styles.songName}>{songId}</Text>
      </View>
      <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity style={[styles.button, { marginRight: 12 }]} onPress={onEdit}>
          <Text style={styles.buttonLabel}>Edit song</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete}>
          <Constants.CastleIcon name="trash" size={22} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const DeckMusic = () => {
  const { showActionSheetWithOptions } = useActionSheet();
  const songs = useCoreState('EDITOR_MUSIC')?.songs;
  const addSong = React.useCallback(
    () =>
      sendAsync('EDITOR_MUSIC_ACTION', {
        action: 'add',
        songId: uuidv4(),
      }),
    [sendAsync]
  );
  const deleteSong = React.useCallback(
    (index) =>
      showActionSheetWithOptions(
        {
          title: `Delete song "${songs[index].songId}"?`,
          options: ['Delete', 'Cancel'],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            sendAsync('EDITOR_MUSIC_ACTION', {
              action: 'remove',
              songId: songs[index].songId,
            });
          }
        }
      ),
    [songs]
  );
  const editSong = React.useCallback(async (songId) => {
    await sendAsync('SOUND_TOOL_START_EDITING', {
      songId,
    });
    sendAsync('EDITOR_GLOBAL_ACTION', {
      action: 'setMode',
      value: 'sound',
    });
  }, []);

  return (
    <View style={styles.content}>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={addSong}>
          <Text style={styles.buttonLabel}>Add new song</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>Id</Text>
      </View>
      <View style={{ flexDirection: 'column-reverse' }}>
        {songs &&
          songs.map((song, ii) => (
            <SongInput
              key={`var-${ii}-${song.songId}`}
              onDelete={() => deleteSong(ii)}
              onEdit={() => editSong(song.songId)}
              {...song}
            />
          ))}
      </View>
    </View>
  );
};
