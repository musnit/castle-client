import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { AppText as Text } from '../../components/AppText';
import { InstrumentIcon } from '../sound/components/InstrumentIcon';
import { Pattern } from '../sound/components/Pattern';
import { useCoreState, useListen, sendGlobalAction, sendAsync } from '../../core/CoreEvents';

import * as Constants from '../../Constants';
const { CastleIcon } = Constants;

import Feather from 'react-native-vector-icons/Feather';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyboardContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    padding: 8,
  },
  keyboardInnerContainer: { flex: 1, flexDirection: 'column', justifyContent: 'space-between' },
  leftContainer: {
    width: 36,
  },
  rightContainer: {
    width: 36,
  },
  close: {
    borderRadius: 6,
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    ...Constants.styles.dropShadow,
    marginBottom: 8,
  },
  toolbar: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    flexDirection: 'column',
    alignItems: 'center',
    ...Constants.styles.dropShadow,
    marginBottom: 8,
  },
  button: {
    width: 36,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  patternContainer: {
    padding: 8,
    width: '100%',
    flexShrink: 1,
    backgroundColor: Constants.colors.white,
    borderRadius: 6,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    ...Constants.styles.dropShadow,
  },
  editInstrumentButton: {
    width: 64,
    height: 64,
    flexShrink: 0,
    borderRadius: 32,
    marginRight: 8,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Constants.styles.dropShadow,
  },
  clockIcon: {
    top: -3,
    left: -1,
  },
  clockTempo: {
    backgroundColor: '#fff',
    borderWidth: 1.3,
    borderColor: '#000',
    borderRadius: 3,
    paddingLeft: 1.5,
    paddingRight: 1,
    position: 'absolute',
    bottom: 3,
    right: 4,
  },
  clockTempoActive: {
    backgroundColor: '#000',
    borderColor: '#fff',
  },
  clockTempoLabel: {
    fontSize: 8,
    fontWeight: '600',
  },
});

const makeButtonStyles = (value, name) => {
  return value === name ? [styles.button, { backgroundColor: '#000' }] : [styles.button];
};

const makeIconColor = (value, name) => {
  return value === name ? '#fff' : '#000';
};

const SUBTOOL_GROUPS = {
  song: [
    {
      name: 'select',
      icon: 'grab',
    },
    {
      name: 'erase',
      icon: 'erase',
    },
  ],
  track: [
    {
      name: 'add_note',
      icon: 'grab',
    },
    {
      name: 'erase_note',
      icon: 'erase',
    },
    {
      name: 'note_velocity',
      icon: 'velocity',
    },
  ],
};

const OverlayPattern = ({ soundToolState, isEditingInstrument, onPressEditInstrument }) => {
  const {
    mode: soundToolMode,
    selectedTrackIndex,
    selectedPatternId,
    selectedSequenceStartTime,
  } = soundToolState;
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Music') || {
    props: {
      song: {
        patterns: {},
        tracks: [],
      },
    },
  };

  if (
    selectedTrackIndex >= 0 &&
    selectedTrackIndex < component.props.song.tracks.length &&
    selectedPatternId &&
    selectedPatternId !== ''
  ) {
    const selectedTrack = component.props.song.tracks[selectedTrackIndex];
    let pattern, sequenceElem;
    pattern = component.props.song.patterns[selectedPatternId];
    const closestKey = Object.keys(selectedTrack.sequence).find(
      (timeStr) => parseFloat(timeStr) === selectedSequenceStartTime
    );
    if (closestKey !== undefined) {
      sequenceElem = selectedTrack.sequence[closestKey];
    }
    return (
      <View style={styles.bottomContainer}>
        {soundToolMode === 'track' && !isEditingInstrument ? (
          <Pressable
            style={({ pressed }) => [
              styles.editInstrumentButton,
              { backgroundColor: pressed ? '#ccc' : '#fff' },
            ]}
            onPress={onPressEditInstrument}>
            <InstrumentIcon instrument={selectedTrack.instrument} color="#000" size={36} />
          </Pressable>
        ) : null}
        <View style={styles.patternContainer}>
          <Pattern pattern={pattern} sequenceElem={sequenceElem} soundToolMode={soundToolMode} />
        </View>
      </View>
    );
  }
  return null;
};

export const OverlaySound = ({ setActiveSheet, activeSheet }) => {
  const soundToolState = useCoreState('EDITOR_SOUND_TOOL') || {};
  const sceneSettingsData = useCoreState('EDITOR_SCENE_SETTINGS') || {
    sceneProperties: { clock: {} },
  };
  const {
    mode,
    subtool: selectedSubtool,
    isPlaying,
    viewFollowsPlayhead,
    selectedTrackIndex,
    selectedPatternId,
    selectedSequenceStartTime,
  } = soundToolState;

  React.useEffect(() => {
    if (selectedTrackIndex < 0 && activeSheet.sound === 'soundTrackInspector') {
      // autoclose sheet if track deselected from engine
      setActiveSheet({ sound: null });
    }
  }, [selectedTrackIndex, activeSheet, setActiveSheet]);

  useListen({
    eventName: 'SHOW_TRACK_INSPECTOR',
    handler: () => setTimeout(() => setActiveSheet({ sound: 'soundTrackInspector' }), 0.125),
  });

  useListen({
    eventName: 'SHOW_ADD_TRACK_SHEET',
    handler: () => setTimeout(() => setActiveSheet({ sound: 'soundNewTrack' }), 0.125),
  });

  const onPressClose = React.useCallback(() => {
    if (mode === 'track') {
      // back out to song view
      sendAsync('EDITOR_SOUND_TOOL_ACTION', { action: 'setMode', stringValue: 'song' });
    } else {
      // exit sound tool
      sendGlobalAction('setMode', 'default');
    }
  }, [mode]);

  const onChangeSubtool = React.useCallback(
    (subtool) => {
      sendAsync('EDITOR_SOUND_TOOL_SET_SUBTOOL', { mode, subtool });
    },
    [mode]
  );
  const subtools = SUBTOOL_GROUPS[mode];

  const onPressEditInstrument = React.useCallback(
    () => setActiveSheet({ sound: 'soundTrackInspector' }),
    [setActiveSheet]
  );

  const onPressClock = React.useCallback(
    () => setActiveSheet({ sound: 'soundClock' }),
    [setActiveSheet]
  );
  const isClockShown = activeSheet.sound === 'soundClock';

  return (
    <KeyboardAvoidingView
      keyboardVerticalOffset={100}
      pointerEvents="box-none"
      style={{
        ...styles.keyboardContainer,
        top: 0,
      }}
      behavior="padding">
      <View style={styles.container} pointerEvents="box-none">
        <View style={styles.leftContainer}>
          <View style={[styles.close, styles.button]}>
            <Pressable onPress={onPressClose}>
              <CastleIcon name="close" size={22} color="#000" />
            </Pressable>
          </View>
        </View>
        <View style={styles.rightContainer}>
          <View style={styles.toolbar}>
            <Pressable
              style={[styles.button, isPlaying ? { backgroundColor: '#000' } : null]}
              onPress={() => sendAsync('EDITOR_SOUND_TOOL_ACTION', { action: 'play' })}>
              <CastleIcon
                name={isPlaying ? 'rewind' : 'play-music'}
                size={22}
                color={isPlaying ? '#fff' : '#000'}
              />
            </Pressable>
          </View>
          <View style={styles.toolbar}>
            <Pressable
              style={[styles.button, viewFollowsPlayhead ? { backgroundColor: '#000' } : null]}
              onPress={() =>
                sendAsync('EDITOR_SOUND_TOOL_ACTION', {
                  action: 'setViewFollowsPlayhead',
                  doubleValue: viewFollowsPlayhead ? 0 : 1,
                })
              }>
              <CastleIcon
                name="playhead-follow"
                size={22}
                color={viewFollowsPlayhead ? '#fff' : '#000'}
              />
            </Pressable>
          </View>
          <View style={styles.toolbar}>
            <Pressable
              style={[styles.button, isClockShown ? { backgroundColor: '#000' } : null]}
              onPress={onPressClock}>
              <Feather
                name="clock"
                style={styles.clockIcon}
                size={22}
                color={isClockShown ? '#fff' : '#000'}
              />
              <View style={[styles.clockTempo, isClockShown ? styles.clockTempoActive : null]}>
                <Text style={[styles.clockTempoLabel, { color: isClockShown ? '#fff' : '#000' }]}>
                  {sceneSettingsData.sceneProperties.clock.tempo}
                </Text>
              </View>
            </Pressable>
          </View>
          <View style={styles.toolbar}>
            {subtools.map((tool, ii) => {
              const { name, icon } = tool;
              return (
                <Pressable
                  key={`toolgroup-${mode}-${ii}`}
                  style={makeButtonStyles(selectedSubtool, name)}
                  onPress={() => onChangeSubtool(name)}>
                  <CastleIcon name={icon} size={22} color={makeIconColor(selectedSubtool, name)} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      {!activeSheet.sound ? (
        <View style={styles.keyboardInnerContainer} pointerEvents="box-none">
          <View />
          <OverlayPattern
            isEditingInstrument={activeSheet.sound === 'soundTrackInspector'}
            onPressEditInstrument={onPressEditInstrument}
            soundToolState={soundToolState}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
};
