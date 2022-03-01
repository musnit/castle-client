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
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnWhiteBorder,
  },
  label: {
    fontSize: 16,
    color: '#000',
    paddingRight: 12,
  },
});

export const Sampler = ({ instrument, lastNativeUpdate }) => {
  // optimistic state
  const [sample, setSample] = React.useState(instrument?.sample);
  React.useEffect(() => setSample(instrument?.sample), [lastNativeUpdate, setSample]);

  const onChangeSample = React.useCallback(
    (sample) => {
      setSample(sample);
      sendAsync('TRACK_TOOL_CHANGE_INSTRUMENT', {
        action: 'setSample',
        sampleValue: sample,
      });
      if (sample.type === 'sfxr' || sample.type === 'tone') {
        sendAsync('EDITOR_CHANGE_SOUND', sample);
      }
    },
    [setSample]
  );

  const onChangeType = React.useCallback(
    (type) => onChangeSample({ ...sample, type }),
    [onChangeSample, sample]
  );
  if (sample) {
    const SampleComponent = SAMPLE_COMPONENTS[sample.type];
    if (SampleComponent) {
      return (
        <View style={styles.container}>
          <View style={styles.row}>
            <Text style={styles.label}>Sampler</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.label}>Type:</Text>
              <InspectorDropdown
                style={{ marginBottom: 0 }}
                value={sample.type}
                onChange={onChangeType}
                {...Metadata.responses['play sound'].props.type}
              />
            </View>
          </View>
          <SampleComponent params={sample} onChangeParams={onChangeSample} />
        </View>
      );
    }
  }
  return null;
};
