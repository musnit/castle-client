import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InspectorCheckbox } from '../../inspector/components/InspectorCheckbox';
import { sendAsync } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';
import ColorPicker from '../../inspector/components/ColorPicker';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    maxWidth: Constants.TABLET_MAX_FORM_WIDTH,
  },
  title: {
    fontSize: 16,
    color: '#000',
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
    (pattern) => {
      sendAsync('TRACK_TOOL_CHANGE_PATTERN', {
        value: pattern,
      });
    },
    [pattern]
  );
  const setColor = React.useCallback(
    (color) => {
      onChangePattern({
        ...pattern,
        notes: undefined, // not going to be used anyway, avoid parsing
        color: { r: color[0], g: color[1], b: color[2], a: color[3] },
      });
    },
    [onChangePattern]
  );
  const setSequenceLoop = React.useCallback((loop) => {
    sendAsync('EDITOR_SOUND_TOOL_ACTION', {
      action: 'setSequenceLoops',
      doubleValue: loop ? 1 : 0,
    });
  }, []);

  if (pattern) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.title}>{pattern.patternId.substring(0, 18)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Color</Text>
          <ColorPicker value={pattern.color} setValue={setColor} />
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
