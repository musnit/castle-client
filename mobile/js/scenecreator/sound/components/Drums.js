import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InspectorCheckbox } from '../../inspector/components/InspectorCheckbox';
import { InspectorDropdown } from '../../inspector/components/InspectorDropdown';
import { InspectorNumberInput } from '../../inspector/components/InspectorNumberInput';
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

  soundInputLabel: {
    fontSize: 16,
  },
  soundInputsRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    flexShrink: 1,
    flexGrow: 0,
    paddingVertical: 8,
  },
  soundInput: {
    maxWidth: '50%',
  },
});

const Kick = ({ value, onChange, enabled, onSetEnabled, lastNativeUpdate }) => {
  const onChangeFreq = React.useCallback(
    (freq) =>
      onChange({
        ...value,
        freq,
      }),
    [value, onChange]
  );
  const onChangeDecay = React.useCallback(
    (decay) =>
      onChange({
        ...value,
        decay,
      }),
    [value, onChange]
  );
  const onChangePunch = React.useCallback(
    (punch) =>
      onChange({
        ...value,
        punch,
      }),
    [value, onChange]
  );
  const onChangeSweep = React.useCallback(
    (sweep) =>
      onChange({
        ...value,
        sweep,
      }),
    [value, onChange]
  );

  return (
    <>
      <View style={styles.row}>
        <Text style={styles.label}>Kick</Text>
        <InspectorCheckbox value={enabled} onChange={onSetEnabled} />
      </View>
      {enabled ? (
        <>
          <View style={styles.soundInputsRow}>
            <Text style={styles.soundInputLabel}>Decay</Text>
            <InspectorNumberInput
              style={styles.soundInput}
              lastNativeUpdate={lastNativeUpdate}
              min={0.05}
              max={1}
              step={0.05}
              placeholder="Tone"
              value={value.decay}
              onChange={onChangeDecay}
            />
          </View>
          <View style={styles.soundInputsRow}>
            <Text style={styles.soundInputLabel}>Punch</Text>
            <InspectorNumberInput
              style={styles.soundInput}
              lastNativeUpdate={lastNativeUpdate}
              min={0}
              max={1}
              step={0.1}
              placeholder="Tone"
              value={value.punch}
              onChange={onChangePunch}
            />
          </View>
          <View style={styles.soundInputsRow}>
            <Text style={styles.soundInputLabel}>Freq</Text>
            <InspectorNumberInput
              style={styles.soundInput}
              lastNativeUpdate={lastNativeUpdate}
              min={40}
              max={120}
              placeholder="Tone"
              value={value.freq}
              onChange={onChangeFreq}
            />
          </View>
          <View style={styles.soundInputsRow}>
            <Text style={styles.soundInputLabel}>Sweep</Text>
            <InspectorNumberInput
              style={styles.soundInput}
              lastNativeUpdate={lastNativeUpdate}
              min={0}
              max={1}
              step={0.1}
              placeholder="Tone"
              value={value.sweep}
              onChange={onChangeSweep}
            />
          </View>
        </>
      ) : null}
    </>
  );
};

export const Drums = ({ instrument }) => {
  const [lastNativeUpdate, incrementLastNativeUpdate] = React.useReducer((state) => state + 1, 0);
  React.useEffect(incrementLastNativeUpdate, [instrument]);

  const onChangeDrums = React.useCallback(
    (drums) => {
      sendAsync('TRACK_TOOL_CHANGE_INSTRUMENT', {
        action: 'setDrums',
        drumsValue: drums,
      });
    },
    [instrument]
  );

  const onChangeDrum = React.useCallback(
    (type, drum) =>
      onChangeDrums({
        ...instrument.params,
        [type]: drum,
      }),
    [instrument.params]
  );

  if (instrument?.params) {
    return (
      <View style={styles.container}>
        <Kick
          enabled={instrument.params.useKick}
          onSetEnabled={(enabled) => onChangeDrum('useKick', enabled)}
          value={instrument.params.kick}
          onChange={(kick) => onChangeDrum('kick', kick)}
          lastNativeUpdate={lastNativeUpdate}
        />
      </View>
    );
  }
  return null;
};
