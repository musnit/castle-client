import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SegmentedNavigation } from '../../../components/SegmentedNavigation';
import { sendAsync } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';
const CastleIcon = Constants.CastleIcon;

import Feather from 'react-native-vector-icons/Feather';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
  },
  headerLeft: {
    paddingLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  trackTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  navigation: {
    paddingTop: 16,
    paddingLeft: 8,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnWhiteBorder,
    flexDirection: 'row',
  },
});

const TrackHeaderActions = ({ onRemoveTrack, isMuted, setIsMuted, onClose }) => {
  return (
    <View style={styles.actions}>
      <TouchableOpacity style={styles.closeButton} onPress={() => setIsMuted(!isMuted)}>
        <Feather name={isMuted ? 'volume-x' : 'volume-2'} size={22} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onRemoveTrack}>
        <CastleIcon name="trash" size={22} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <CastleIcon name="close" size={22} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

export const SoundTrackInspectorHeader = ({
  isOpen,
  title,
  tabItems,
  selectedTab,
  setSelectedTab,
  soundToolState,
  component,
}) => {
  const { selectedTrackIndex } = soundToolState;
  let selectedTrack;
  if (component && selectedTrackIndex >= 0) {
    selectedTrack = component.props.song.tracks[selectedTrackIndex];
  }

  const removeTrack = React.useCallback(async () => {
    await sendAsync('EDITOR_SOUND_TOOL_ACTION', {
      action: 'deleteTrack',
      doubleValue: selectedTrackIndex,
    });
    sendAsync('EDITOR_SOUND_TOOL_ACTION', { action: 'selectTrack', doubleValue: -1 });
  }, [selectedTrackIndex]);

  const deselectTrack = React.useCallback(() => {
    sendAsync('EDITOR_SOUND_TOOL_ACTION', { action: 'selectTrack', doubleValue: -1 });
  }, []);

  const instrumentProps = selectedTrack?.instrument.props || {};
  const isMuted = instrumentProps.muted || false;
  const setIsMuted = React.useCallback(
    (muted) => {
      sendAsync('TRACK_TOOL_CHANGE_INSTRUMENT', {
        action: 'setProps',
        props: {
          ...instrumentProps,
          muted,
        },
      });
    },
    [instrumentProps]
  );

  return (
    <View pointerEvents={isOpen ? 'auto' : 'none'}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.trackTitle}>{title}</Text>
        </View>
        <TrackHeaderActions
          onRemoveTrack={removeTrack}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onClose={deselectTrack}
        />
      </View>
      <View style={styles.navigation}>
        <SegmentedNavigation
          items={tabItems}
          selectedItem={tabItems.find((i) => i.value === selectedTab)}
          onSelectItem={(item) => setSelectedTab(item.value)}
          isLightBackground
          compact={true}
        />
      </View>
    </View>
  );
};
