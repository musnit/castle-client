import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { useCoreState, sendAsync, sendBehaviorAction } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    alignItems: 'flex-start',
  },
  label: {
    fontWeight: '600',
    paddingBottom: 16,
    fontSize: 16,
  },
  track: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  trackName: {
    fontSize: 16,
    paddingRight: 12,
  },
  trackControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackControl: {
    paddingHorizontal: 8,
  },
});

const MusicComponent = ({ song, removeMusicComponent }) => {
  const { tracks } = song;
  const editMusic = React.useCallback(async (trackIndex) => {
    await sendAsync('SOUND_TOOL_START_EDITING', {
      trackIndex,
    });
    sendAsync('EDITOR_GLOBAL_ACTION', {
      action: 'setMode',
      value: 'sound',
    });
  }, []);
  const addTrack = React.useCallback(async () => {
    const newTrackIndex = tracks.length;
    await sendAsync('EDITOR_GLOBAL_ACTION', {
      action: 'setMode',
      value: 'sound',
    });
    sendAsync('EDITOR_SOUND_TOOL_ACTION', { action: 'addTrack' });
  }, [tracks]);
  const deleteTrack = React.useCallback(
    (index) => {
      if (tracks.length > 1) {
        sendAsync('EDITOR_SOUND_TOOL_ACTION', { action: 'deleteTrack', doubleValue: index });
      } else {
        // remove music component if this would result in empty tracks list
        removeMusicComponent();
      }
    },
    [tracks, removeMusicComponent]
  );

  return (
    <>
      {tracks.map((track, ii) => (
        <View key={`track-${ii}`} style={styles.track}>
          <Text style={styles.trackName}>{track.instrument.type}</Text>
          <View style={styles.trackControls}>
            <Pressable style={styles.trackControl} onPress={() => editMusic(ii)}>
              <MCIcon name="pencil-outline" size={20} color="#000" />
            </Pressable>
            <Pressable style={styles.trackControl} onPress={() => deleteTrack(ii)}>
              <Constants.CastleIcon name="trash" size={22} color="#000" />
            </Pressable>
          </View>
        </View>
      ))}
      <View style={styles.track}>
        <View />
        <Pressable style={SceneCreatorConstants.styles.button} onPress={addTrack}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>Add Track</Text>
        </Pressable>
      </View>
    </>
  );
};

export default InspectorMusic = ({ music }) => {
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Music');
  const sendAction = React.useCallback(
    (...args) => sendBehaviorAction('Music', ...args),
    [sendBehaviorAction]
  );

  const addMusic = () => sendAction('add');
  const removeMusic = () => sendAction('remove');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Music</Text>
      {component ? (
        <MusicComponent removeMusicComponent={removeMusic} {...component.props} />
      ) : (
        <Pressable style={SceneCreatorConstants.styles.button} onPress={addMusic}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>Add Music</Text>
        </Pressable>
      )}
    </View>
  );
};
