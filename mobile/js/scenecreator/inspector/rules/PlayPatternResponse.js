import * as React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useListen, sendAsync } from '../../../core/CoreEvents';

import shortid from 'shortid';

import * as SceneCreatorConstants from '../../SceneCreatorConstants';

const styles = StyleSheet.create({
  responseCells: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export const PlayPatternResponse = ({ response, onChangeResponse, children, order, ...props }) => {
  const soundEditorSessionId = React.useRef(shortid.generate());

  const onPressPattern = React.useCallback(async () => {
    await sendAsync('SOUND_TOOL_SET_DATA', {
      sessionId: soundEditorSessionId.current,
      patternToEdit: response.pattern,
    });
    sendAsync('EDITOR_GLOBAL_ACTION', {
      action: 'setMode',
      value: 'sound',
    });
  }, [soundEditorSessionId.current, response.pattern]);

  const patternChanged = React.useCallback(
    ({ sessionId, pattern }) => {
      if (sessionId == soundEditorSessionId.current) {
        onChangeResponse({
          ...response,
          params: {
            ...response.params,
            pattern,
          },
        });
      }
    },
    [response, onChangeResponse]
  );

  useListen({
    eventName: 'EDITOR_SOUND_TOOL_PATTERN',
    handler: patternChanged,
  });

  return (
    <View style={styles.responseCells}>
      {children}
      <TouchableOpacity style={SceneCreatorConstants.styles.button} onPress={onPressPattern}>
        <Text style={SceneCreatorConstants.styles.buttonLabel}>Edit Pattern</Text>
      </TouchableOpacity>
    </View>
  );
};
