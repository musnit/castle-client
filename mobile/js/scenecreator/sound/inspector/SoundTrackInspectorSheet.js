import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { Drums } from '../components/Drums';
import { Sampler } from '../components/Sampler';
import { SoundTrackInspectorHeader } from './SoundTrackInspectorHeader';
import { useCoreState, sendAsync } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';
const CastleIcon = Constants.CastleIcon;

const INSTRUMENT_COMPONENTS = {
  sampler: Sampler,
  drums: Drums,
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

const TrackInspector = ({ component, soundToolState }) => {
  let selectedTrack;
  const { selectedTrackIndex, selectedPatternId } = soundToolState;
  if (selectedTrackIndex >= 0) {
    selectedTrack = component.props.song.tracks[selectedTrackIndex];
  }

  if (selectedTrack) {
    return <EditInstrument instrument={selectedTrack.instrument} />;
  }
  return null;
};

export const SoundTrackInspectorSheet = ({ isOpen, onClose }) => {
  const soundToolState = useCoreState('EDITOR_SOUND_TOOL') || {};
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Music') || {
    props: {
      song: {
        patterns: {},
        tracks: [],
      },
    },
  };

  const renderHeader = () => (
    <SoundTrackInspectorHeader
      isOpen={isOpen}
      onClose={onClose}
      soundToolState={soundToolState}
      component={component}
    />
  );

  const renderContent = () =>
    !isOpen ? null : (
      <TrackInspector
        soundToolState={soundToolState}
        component={component}
      />
    );

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      headerHeight={88}
      extraTopInset={8}
      renderContent={renderContent}
      renderHeader={renderHeader}
      persistLastSnapWhenOpened
    />
  );
};
