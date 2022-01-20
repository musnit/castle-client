import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InspectorDropdown } from '../../inspector/components/InspectorDropdown';
import { SAMPLE_COMPONENTS } from './Sample';
import { sendAsync } from '../../../core/CoreEvents';

import Metadata from '../../Metadata';

import * as Constants from '../../../Constants';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    maxWidth: Constants.TABLET_MAX_FORM_WIDTH,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#000',
    paddingRight: 12,
  },
});

export const Sampler = ({ instrument }) => {
  const onChangeSample = React.useCallback(
    (sample) => {
      sendAsync('TRACK_TOOL_CHANGE_INSTRUMENT', {
        action: 'setSample',
        sampleValue: sample,
      });
      if (sample.type === 'sfxr' || sample.type === 'tone') {
        sendAsync('EDITOR_CHANGE_SOUND', sample);
      }
    },
    [instrument]
  );
  const onChangeType = React.useCallback(
    (type) => onChangeSample({ ...instrument.sample, type }),
    [onChangeSample]
  );
  if (instrument?.sample) {
    const SampleComponent = SAMPLE_COMPONENTS[instrument.sample.type];
    if (SampleComponent) {
      return (
        <View style={styles.container}>
          <View style={styles.row}>
            <Text style={styles.label}>Sample type:</Text>
            <InspectorDropdown
              style={{ marginBottom: 0 }}
              value={instrument.sample.type}
              onChange={onChangeType}
              {...Metadata.responses['play sound'].props.type}
            />
          </View>
          <SampleComponent params={instrument.sample} onChangeParams={onChangeSample} />
        </View>
      );
    }
  }
  return null;
};
