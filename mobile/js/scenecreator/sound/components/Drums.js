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
  drumContainer: {
    backgroundColor: '#fff',
    ...Constants.styles.dropShadow,
    padding: 16,
    borderWidth: 1,
    borderRadius: 6,
    borderColor: Constants.colors.black,
    marginBottom: 8,
  },
  drumParams: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Constants.colors.grayOnWhiteBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingTop: 16,
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
    <View style={styles.drumContainer}>
      <View style={styles.row}>
        <Text style={styles.label}>Kick</Text>
        <InspectorCheckbox value={enabled} onChange={onSetEnabled} />
      </View>
      {enabled ? (
        <View style={styles.drumParams}>
          <View style={styles.soundInputsRow}>
            <Text style={styles.soundInputLabel}>Decay</Text>
            <InspectorNumberInput
              style={styles.soundInput}
              lastNativeUpdate={lastNativeUpdate}
              min={0.05}
              max={1}
              step={0.05}
              placeholder="Decay"
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
              placeholder="Punch"
              value={value.punch}
              onChange={onChangePunch}
            />
          </View>
          <View style={styles.soundInputsRow}>
            <Text style={styles.soundInputLabel}>Tune</Text>
            <InspectorNumberInput
              style={styles.soundInput}
              lastNativeUpdate={lastNativeUpdate}
              min={40}
              max={120}
              placeholder="Tune"
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
              placeholder="Sweep"
              value={value.sweep}
              onChange={onChangeSweep}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};

const Hat = ({ value, onChange, enabled, onSetEnabled, lastNativeUpdate }) => {
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
  const onChangeBody = React.useCallback(
    (body) =>
      onChange({
        ...value,
        body,
      }),
    [value, onChange]
  );

  return (
    <View style={styles.drumContainer}>
      <View style={styles.row}>
        <Text style={styles.label}>Hat</Text>
        <InspectorCheckbox value={enabled} onChange={onSetEnabled} />
      </View>
      {enabled ? (
        <View style={styles.drumParams}>
          <View style={styles.soundInputsRow}>
            <Text style={styles.soundInputLabel}>Decay</Text>
            <InspectorNumberInput
              style={styles.soundInput}
              lastNativeUpdate={lastNativeUpdate}
              min={0.05}
              max={0.35}
              step={0.05}
              placeholder="Decay"
              value={value.decay}
              onChange={onChangeDecay}
            />
          </View>
          <View style={styles.soundInputsRow}>
            <Text style={styles.soundInputLabel}>Tone</Text>
            <InspectorNumberInput
              style={styles.soundInput}
              lastNativeUpdate={lastNativeUpdate}
              min={0.5}
              max={1}
              step={0.1}
              placeholder="Tone"
              value={value.freq}
              onChange={onChangeFreq}
            />
          </View>
          <View style={styles.soundInputsRow}>
            <Text style={styles.soundInputLabel}>Body</Text>
            <InspectorNumberInput
              style={styles.soundInput}
              lastNativeUpdate={lastNativeUpdate}
              min={0}
              max={1}
              step={0.2}
              placeholder="Body"
              value={value.body}
              onChange={onChangeBody}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};

const Snare = ({ value, onChange, enabled, onSetEnabled, lastNativeUpdate }) => {
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
  const onChangeTambre = React.useCallback(
    (tambre) =>
      onChange({
        ...value,
        tambre,
      }),
    [value, onChange]
  );

  return (
    <View style={styles.drumContainer}>
      <View style={styles.row}>
        <Text style={styles.label}>Snare</Text>
        <InspectorCheckbox value={enabled} onChange={onSetEnabled} />
      </View>
      {enabled ? (
        <View style={styles.drumParams}>
          <View style={styles.soundInputsRow}>
            <Text style={styles.soundInputLabel}>Decay</Text>
            <InspectorNumberInput
              style={styles.soundInput}
              lastNativeUpdate={lastNativeUpdate}
              min={0.1}
              max={0.5}
              step={0.05}
              placeholder="Decay"
              value={value.decay}
              onChange={onChangeDecay}
            />
          </View>
          <View style={styles.soundInputsRow}>
            <Text style={styles.soundInputLabel}>Tone</Text>
            <InspectorNumberInput
              style={styles.soundInput}
              lastNativeUpdate={lastNativeUpdate}
              min={0}
              max={1}
              step={0.1}
              placeholder="Tone"
              value={value.freq}
              onChange={onChangeFreq}
            />
          </View>
          <View style={styles.soundInputsRow}>
            <Text style={styles.soundInputLabel}>Tambre</Text>
            <InspectorNumberInput
              style={styles.soundInput}
              lastNativeUpdate={lastNativeUpdate}
              min={0}
              max={1}
              step={0.2}
              placeholder="Tambre"
              value={value.tambre}
              onChange={onChangeTambre}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};

const Tom = ({ value, onChange, enabled, onSetEnabled, lastNativeUpdate }) => {
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

  return (
    <View style={styles.drumContainer}>
      <View style={styles.row}>
        <Text style={styles.label}>Tom</Text>
        <InspectorCheckbox value={enabled} onChange={onSetEnabled} />
      </View>
      {enabled ? (
        <View style={styles.drumParams}>
          <View style={styles.soundInputsRow}>
            <Text style={styles.soundInputLabel}>Decay</Text>
            <InspectorNumberInput
              style={styles.soundInput}
              lastNativeUpdate={lastNativeUpdate}
              min={0.1}
              max={0.4}
              step={0.05}
              placeholder="Decay"
              value={value.decay}
              onChange={onChangeDecay}
            />
          </View>
          <View style={styles.soundInputsRow}>
            <Text style={styles.soundInputLabel}>Tone</Text>
            <InspectorNumberInput
              style={styles.soundInput}
              lastNativeUpdate={lastNativeUpdate}
              min={0}
              max={1}
              step={0.1}
              placeholder="Tone"
              value={value.freq}
              onChange={onChangeFreq}
            />
          </View>
        </View>
      ) : null}
    </View>
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
        <Tom
          enabled={instrument.params.useLoTom}
          onSetEnabled={(enabled) => onChangeDrum('useLoTom', enabled)}
          value={instrument.params.loTom}
          onChange={(loTom) => onChangeDrum('loTom', loTom)}
          lastNativeUpdate={lastNativeUpdate}
        />
        <Tom
          enabled={instrument.params.useHiTom}
          onSetEnabled={(enabled) => onChangeDrum('useHiTom', enabled)}
          value={instrument.params.hiTom}
          onChange={(hiTom) => onChangeDrum('hiTom', hiTom)}
          lastNativeUpdate={lastNativeUpdate}
        />
        <Snare
          enabled={instrument.params.useSnare}
          onSetEnabled={(enabled) => onChangeDrum('useSnare', enabled)}
          value={instrument.params.snare}
          onChange={(snare) => onChangeDrum('snare', snare)}
          lastNativeUpdate={lastNativeUpdate}
        />
        <Hat
          enabled={instrument.params.useClosedHat}
          onSetEnabled={(enabled) => onChangeDrum('useClosedHat', enabled)}
          value={instrument.params.closedHat}
          onChange={(closedHat) => onChangeDrum('closedHat', closedHat)}
          lastNativeUpdate={lastNativeUpdate}
        />
        <Hat
          enabled={instrument.params.useOpenHat}
          onSetEnabled={(enabled) => onChangeDrum('useOpenHat', enabled)}
          value={instrument.params.openHat}
          onChange={(openHat) => onChangeDrum('openHat', openHat)}
          lastNativeUpdate={lastNativeUpdate}
        />
      </View>
    );
  }
  return null;
};
