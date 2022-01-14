import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from '../../../components/BottomSheet';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { Sampler } from '../components/Sampler';
import { useCoreState, sendAsync } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';
const CastleIcon = Constants.CastleIcon;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#000',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -32,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
});

const INSTRUMENT_COMPONENTS = {
  sampler: Sampler,
  // TODO: more instruments
};

const EditInstrument = (props) => {
  const type = props.instrument?.type;
  const InstrumentComponent = INSTRUMENT_COMPONENTS[type];
  if (InstrumentComponent) {
    return <InstrumentComponent {...props} />;
  }
  return null;
};

const TrackHeaderActions = ({ onRemoveTrack }) => {
  return (
    <View style={styles.actions}>
      <TouchableOpacity style={styles.actionButton} onPress={onRemoveTrack}>
        <CastleIcon name="trash" size={22} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

export const SoundEditInstrumentSheet = ({ isOpen, ...props }) => {
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Music') || {
    props: {
      song: {
        tracks: [],
      },
    },
  };
  const soundToolState = useCoreState('EDITOR_SOUND_TOOL') || {};
  const { selectedTrackIndex } = soundToolState;
  let selectedTrack, instrument;
  if (selectedTrackIndex >= 0) {
    selectedTrack = component.props.song.tracks[selectedTrackIndex];
    instrument = selectedTrack?.instrument;
  }

  const deselectTrack = React.useCallback(() => {
    sendAsync('EDITOR_SOUND_TOOL_ACTION', { action: 'selectTrack', doubleValue: -1 });
  }, []);
  const removeTrack = React.useCallback(async () => {
    await sendAsync('EDITOR_SOUND_TOOL_ACTION', {
      action: 'deleteTrack',
      doubleValue: selectedTrackIndex,
    });
    sendAsync('EDITOR_SOUND_TOOL_ACTION', { action: 'selectTrack', doubleValue: -1 });
  }, [selectedTrackIndex]);

  const title = 'Sampler'; // TODO: track identifier of some kind
  const renderHeaderActions = () => <TrackHeaderActions onRemoveTrack={removeTrack} />;
  const renderHeader = () => (
    <BottomSheetHeader title={title} onClose={deselectTrack} renderActions={renderHeaderActions} />
  );

  const renderContent = () => (!isOpen ? null : <EditInstrument instrument={instrument} />);

  return (
    <BottomSheet
      isOpen={isOpen}
      initialSnap={1}
      renderContent={renderContent}
      renderHeader={renderHeader}
      style={styles.container}
      {...props}
    />
  );
};
