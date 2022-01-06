import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SAMPLE_COMPONENTS } from './Sample';
import { sendAsync } from '../../../core/CoreEvents';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
});

export const Sampler = ({ instrument }) => {
  const onChangeSample = React.useCallback(
    (sample) => {
      sendAsync('SOUND_TOOL_CHANGE_INSTRUMENT', {
        sampleValue: sample,
      });
      if (sample.type === 'sfxr') {
        sendAsync('EDITOR_CHANGE_SOUND', sample);
      }
    },
    [instrument]
  );
  if (instrument?.sample) {
    const SampleComponent = SAMPLE_COMPONENTS[instrument.sample.type];
    if (SampleComponent) {
      return (
        <View style={styles.container}>
          <SampleComponent params={instrument.sample} onChangeParams={onChangeSample} />
        </View>
      );
    }
  }
  return null;
};
