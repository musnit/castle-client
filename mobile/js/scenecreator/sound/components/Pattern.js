import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { InspectorCheckbox } from '../../inspector/components/InspectorCheckbox';
import { InspectorTextInput } from '../../inspector/components/InspectorTextInput';
import { makeDefaultPatternName } from '../../SceneCreatorUtilities';
import { sendAsync } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';
import ColorPicker from '../../inspector/components/ColorPicker';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    maxWidth: Constants.TABLET_MAX_FORM_WIDTH,
  },
  nameInput: {
    fontSize: 16,
    color: '#000',
    width: '66%',
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  label: {
    fontSize: 16,
    color: '#000',
  },
  empty: {
    fontSize: 16,
    color: '#666',
  },
});

export const Pattern = ({ pattern, sequenceElem }) => {
  const onChangePattern = React.useCallback(
    (props) => {
      sendAsync('TRACK_TOOL_CHANGE_PATTERN', {
        value: {
          ...pattern,
          notes: undefined, // not going to be used anyway, avoid parsing
          ...props,
        },
      });
    },
    [pattern]
  );
  const setColor = React.useCallback(
    (color) =>
      onChangePattern({
        color: { r: color[0], g: color[1], b: color[2], a: color[3] },
      }),
    [onChangePattern]
  );
  const setName = React.useCallback((name) => onChangePattern({ name }), [onChangePattern]);
  const setSequenceLoop = React.useCallback((loop) => {
    sendAsync('EDITOR_SOUND_TOOL_ACTION', {
      action: 'setSequenceLoops',
      doubleValue: loop ? 1 : 0,
    });
  }, []);
  const forkPattern = React.useCallback((fork) => {
    sendAsync('EDITOR_SOUND_TOOL_ACTION', {
      action: 'forkSelectedPattern',
    });
  }, []);

  if (pattern) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <View style={[styles.row, { justifyContent: 'flex-start' }]}>
            <View style={{ marginRight: 8 }}>
              <ColorPicker value={pattern.color} setValue={setColor} />
            </View>
            <InspectorTextInput
              style={styles.nameInput}
              value={pattern.name}
              onChangeText={setName}
              placeholder={makeDefaultPatternName(pattern)}
            />
          </View>
          <TouchableOpacity onPress={forkPattern} style={SceneCreatorConstants.styles.button}>
            <Text style={SceneCreatorConstants.styles.buttonLabel}>Fork</Text>
          </TouchableOpacity>
        </View>
        {sequenceElem ? (
          <View style={styles.row}>
            <Text style={styles.label}>Loop here</Text>
            <InspectorCheckbox value={sequenceElem.loop} onChange={setSequenceLoop} />
          </View>
        ) : null}
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.empty}>No pattern selected</Text>
    </View>
  );
};
