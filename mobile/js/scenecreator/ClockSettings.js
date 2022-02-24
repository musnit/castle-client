import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InspectorNumberInput } from './inspector/components/InspectorNumberInput';
import { useCoreState, sendAsync } from '../core/CoreEvents';

import FeatherIcon from 'react-native-vector-icons/Feather';

const styles = StyleSheet.create({
  container: {},
  settingsRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    padding: 16,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingBottom: 16,
  },
  numberInput: {
    width: '50%',
  },
  numberLabel: {
    fontSize: 16,
  },
  explainer: {
    padding: 16,
    flexDirection: 'row',
  },
  explainerIcon: {
    marginTop: 4,
    marginRight: 12,
  },
  explainerText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#888',
  },
});

export const ClockSettings = () => {
  const settingsData = useCoreState('EDITOR_SCENE_SETTINGS');
  const sendAction = (...args) => sendAsync('EDITOR_CHANGE_SCENE_SETTINGS', ...args);
  return (
    <View style={styles.container}>
      <View style={[styles.settingsRow, styles.numberRow]}>
        <Text style={styles.numberLabel}>Clock tempo</Text>
        <View style={styles.numberInput}>
          <InspectorNumberInput
            min={30}
            max={360}
            value={settingsData.sceneProperties.clock.tempo}
            onChange={(value) =>
              sendAction({ type: 'scene', action: 'setClockTempo', doubleValue: value })
            }
          />
        </View>
      </View>
      <View style={[styles.settingsRow, styles.numberRow]}>
        <Text style={styles.numberLabel}>Clock beats per bar</Text>
        <View style={styles.numberInput}>
          <InspectorNumberInput
            min={2}
            max={12}
            value={settingsData.sceneProperties.clock.beatsPerBar}
            onChange={(value) =>
              sendAction({ type: 'scene', action: 'setClockBeatsPerBar', doubleValue: value })
            }
          />
        </View>
      </View>
      <View style={[styles.settingsRow, styles.numberRow]}>
        <Text style={styles.numberLabel}>Clock steps per beat</Text>
        <View style={styles.numberInput}>
          <InspectorNumberInput
            min={2}
            max={6}
            value={settingsData.sceneProperties.clock.stepsPerBeat}
            onChange={(value) =>
              sendAction({ type: 'scene', action: 'setClockStepsPerBeat', doubleValue: value })
            }
          />
        </View>
      </View>
      <View style={styles.explainer}>
        <FeatherIcon name="book-open" size={18} color="#888" style={styles.explainerIcon} />
        <Text style={styles.explainerText}>
          Clock settings are shared across all actors and rules in this card. The clock continues to
          tick when switching to another card.
        </Text>
      </View>
    </View>
  );
};
