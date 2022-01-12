import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { useCoreState, sendAsync, sendBehaviorAction } from '../../../core/CoreEvents';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

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
    paddingBottom: 8,
  },
  trackName: {
    fontSize: 16,
    paddingRight: 12,
  },
});

const MusicComponent = ({ song }) => {
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

  return (
    <>
      {tracks.map((track, ii) => (
        <View key={`track-${ii}`} style={styles.track}>
          <Text style={styles.trackName}>{track.instrument.type}</Text>
          <Pressable style={SceneCreatorConstants.styles.button} onPress={() => editMusic(ii)}>
            <Text style={SceneCreatorConstants.styles.buttonLabel}>Edit</Text>
          </Pressable>
        </View>
      ))}
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

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Music</Text>
      {component ? (
        <MusicComponent {...component.props} />
      ) : (
        <Pressable style={SceneCreatorConstants.styles.button} onPress={addMusic}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>Add Music</Text>
        </Pressable>
      )}
    </View>
  );
};
