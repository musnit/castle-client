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
    alignItems: 'center',
    paddingBottom: 12,
  },
});

export default InspectorMusic = ({ music }) => {
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Music');
  const sendAction = React.useCallback(
    (...args) => sendBehaviorAction('Music', ...args),
    [sendBehaviorAction]
  );
  const editMusic = React.useCallback(async () => {
    sendAsync('EDITOR_GLOBAL_ACTION', {
      action: 'setMode',
      value: 'sound',
    });
  }, []);

  const addMusic = () => sendAction('add');
  const removeMusic = () => sendAction('remove');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Music</Text>
      {component ? (
        <View style={styles.track}>
          <Pressable
            style={[SceneCreatorConstants.styles.button, { marginRight: 8 }]}
            onPress={editMusic}>
            <Text style={SceneCreatorConstants.styles.buttonLabel}>Edit Music</Text>
          </Pressable>
          <Pressable style={SceneCreatorConstants.styles.button} onPress={removeMusic}>
            <Text style={SceneCreatorConstants.styles.buttonLabel}>Remove Music</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={SceneCreatorConstants.styles.button} onPress={addMusic}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>Add Music</Text>
        </Pressable>
      )}
    </View>
  );
};
