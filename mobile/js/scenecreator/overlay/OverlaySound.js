import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useCoreState, sendGlobalAction, sendAsync } from '../../core/CoreEvents';

import * as Constants from '../../Constants';
const { CastleIcon } = Constants;

import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
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
      name: 'select',
      icon: 'grab',
    },
    {
      name: 'erase',
      icon: 'erase',
    },
  ],
};

export const OverlaySound = ({ setActiveSheet, activeSheet }) => {
  const {
    mode,
    subtool: selectedSubtool,
    isPlaying,
    viewFollowsPlayhead,
    selectedTrackIndex,
  } = useCoreState('EDITOR_SOUND_TOOL') || {};
  React.useEffect(() => {
    if (selectedTrackIndex >= 0 && activeSheet.sound !== 'soundTrackInspector') {
      setActiveSheet({ sound: 'soundTrackInspector' });
    } else if (selectedTrackIndex < 0 && activeSheet.sound == 'soundTrackInspector') {
      setActiveSheet({ sound: null });
    }
  }, [selectedTrackIndex, setActiveSheet, activeSheet.sound]);

  const onPressClose = React.useCallback(() => {
    if (mode === 'track') {
      // back out to song view
      sendAsync('EDITOR_SOUND_TOOL_ACTION', { action: 'selectTrack', doubleValue: -1 });
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

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.leftContainer}>
        <View style={[styles.close, styles.button]}>
          <Pressable onPress={onPressClose}>
            <CastleIcon name="close" size={22} color="#000" />
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
      <View style={styles.rightContainer}>
        <View style={styles.toolbar}>
          <Pressable
            style={[styles.button, isPlaying ? { backgroundColor: '#000' } : null]}
            onPress={() => sendAsync('EDITOR_SOUND_TOOL_ACTION', { action: 'play' })}>
            <CastleIcon
              name={isPlaying ? 'rewind' : 'play'}
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
            <MCIcon name="arrow-right" size={22} color={viewFollowsPlayhead ? '#fff' : '#000'} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
