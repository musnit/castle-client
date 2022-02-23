import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
    flexDirection: 'row',
  },
  drumContainer: {
    flex: 1,
    minWidth: 256,
    backgroundColor: '#fff',
    ...Constants.styles.dropShadow,
    padding: 16,
    borderWidth: 1,
    borderRadius: 6,
    borderColor: Constants.colors.black,
    marginRight: 16,
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

const DRUM_PARAMS = {
  kick: [
    {
      name: 'decay',
      label: 'Decay',
      min: 0.05,
      max: 1,
      step: 0.05,
    },
    {
      name: 'punch',
      label: 'Punch',
      min: 0,
      max: 1,
      step: 0.1,
    },
    {
      name: 'freq',
      label: 'Tune',
      min: 40,
      max: 120,
    },
    {
      name: 'sweep',
      label: 'Sweep',
      min: 0,
      max: 1,
      step: 0.1,
    },
  ],
  snare: [
    {
      name: 'decay',
      label: 'Decay',
      min: 0.1,
      max: 0.5,
      step: 0.05,
    },
    {
      name: 'freq',
      label: 'Tone',
      min: 0,
      max: 1,
      step: 0.1,
    },
    {
      name: 'tambre',
      label: 'Tambre',
      min: 0,
      max: 1,
      step: 0.2,
    },
  ],
  clap: [
    {
      name: 'decay',
      label: 'Decay',
      min: 0,
      max: 0.5,
      step: 0.05,
    },
    {
      name: 'freq',
      label: 'Tone',
      min: 0,
      max: 1,
      step: 0.1,
    },
  ],
  tom: [
    {
      name: 'decay',
      label: 'Decay',
      min: 0.1,
      max: 0.4,
      step: 0.05,
    },
    {
      name: 'freq',
      label: 'Tone',
      min: 0,
      max: 1,
      step: 0.1,
    },
  ],
  hat: [
    {
      name: 'decay',
      label: 'Decay',
      min: 0.05,
      max: 0.35,
      step: 0.05,
    },
    {
      name: 'freq',
      label: 'Tone',
      min: 0.5,
      max: 1,
      step: 0.1,
    },
    {
      name: 'body',
      label: 'Body',
      min: 0,
      max: 1,
      step: 0.2,
    },
  ],
};

const Drum = ({ name, value, onChange, enabled, onSetEnabled, paramSpecs, lastNativeUpdate }) => {
  // paramSpecs: array
  //   --> { name, min, max, step }
  const onChangeParam = React.useCallback(
    (paramName, paramVal) =>
      onChange({
        ...value,
        [paramName]: paramVal,
      }),
    [value, onChange]
  );

  return (
    <View style={styles.drumContainer}>
      <View style={styles.row}>
        <Text style={styles.label}>{name}</Text>
        <InspectorCheckbox value={enabled} onChange={onSetEnabled} />
      </View>
      {enabled ? (
        <View style={styles.drumParams}>
          {paramSpecs.map((spec) => (
            <View style={styles.soundInputsRow} key={`spec-${spec.name}`}>
              <Text style={styles.soundInputLabel}>{spec.label}</Text>
              <InspectorNumberInput
                style={styles.soundInput}
                lastNativeUpdate={lastNativeUpdate}
                {...spec}
                placeholder={spec.label}
                value={value[spec.name]}
                onChange={(paramVal) => onChangeParam(spec.name, paramVal)}
              />
            </View>
          ))}
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} horizontal>
        <Drum
          name="Kick"
          paramSpecs={DRUM_PARAMS.kick}
          enabled={instrument.params.useKick}
          onSetEnabled={(enabled) => onChangeDrum('useKick', enabled)}
          value={instrument.params.kick}
          onChange={(kick) => onChangeDrum('kick', kick)}
          lastNativeUpdate={lastNativeUpdate}
        />
        <Drum
          name="Low Tom"
          paramSpecs={DRUM_PARAMS.tom}
          enabled={instrument.params.useLoTom}
          onSetEnabled={(enabled) => onChangeDrum('useLoTom', enabled)}
          value={instrument.params.loTom}
          onChange={(loTom) => onChangeDrum('loTom', loTom)}
          lastNativeUpdate={lastNativeUpdate}
        />
        <Drum
          name="High Tom"
          paramSpecs={DRUM_PARAMS.tom}
          enabled={instrument.params.useHiTom}
          onSetEnabled={(enabled) => onChangeDrum('useHiTom', enabled)}
          value={instrument.params.hiTom}
          onChange={(hiTom) => onChangeDrum('hiTom', hiTom)}
          lastNativeUpdate={lastNativeUpdate}
        />
        <Drum
          name="Snare"
          paramSpecs={DRUM_PARAMS.snare}
          enabled={instrument.params.useSnare}
          onSetEnabled={(enabled) => onChangeDrum('useSnare', enabled)}
          value={instrument.params.snare}
          onChange={(snare) => onChangeDrum('snare', snare)}
          lastNativeUpdate={lastNativeUpdate}
        />
        <Drum
          name="Clap"
          paramSpecs={DRUM_PARAMS.clap}
          enabled={instrument.params.useClap}
          onSetEnabled={(enabled) => onChangeDrum('useClap', enabled)}
          value={instrument.params.clap}
          onChange={(clap) => onChangeDrum('clap', clap)}
          lastNativeUpdate={lastNativeUpdate}
        />
        <Drum
          name="Closed Hat"
          paramSpecs={DRUM_PARAMS.hat}
          enabled={instrument.params.useClosedHat}
          onSetEnabled={(enabled) => onChangeDrum('useClosedHat', enabled)}
          value={instrument.params.closedHat}
          onChange={(closedHat) => onChangeDrum('closedHat', closedHat)}
          lastNativeUpdate={lastNativeUpdate}
        />
        <Drum
          name="Open Hat"
          paramSpecs={DRUM_PARAMS.hat}
          enabled={instrument.params.useOpenHat}
          onSetEnabled={(enabled) => onChangeDrum('useOpenHat', enabled)}
          value={instrument.params.openHat}
          onChange={(openHat) => onChangeDrum('openHat', openHat)}
          lastNativeUpdate={lastNativeUpdate}
        />
      </ScrollView>
    );
  }
  return null;
};
