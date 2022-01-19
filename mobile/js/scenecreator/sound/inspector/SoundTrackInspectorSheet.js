import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from '../../../components/BottomSheet';
import { Pattern } from '../components/Pattern';
import { Sampler } from '../components/Sampler';
import { SoundTrackInspectorHeader } from './SoundTrackInspectorHeader';
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

const TAB_ITEMS = [
  {
    name: 'Sound',
    value: 'instrument',
  },
  {
    name: 'Pattern',
    value: 'pattern',
  },
];

const TrackInspectorTabs = ({ soundToolState, selectedTab }) => {
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Music') || {
    props: {
      song: {
        patterns: {},
        tracks: [],
      },
    },
  };

  let selectedTrack;
  const { selectedTrackIndex, selectedPatternId, selectedSequenceStartTime } = soundToolState;
  if (selectedTrackIndex >= 0) {
    selectedTrack = component.props.song.tracks[selectedTrackIndex];
  }

  if (selectedTrack) {
    switch (selectedTab) {
      case 'instrument': {
        return <EditInstrument instrument={selectedTrack.instrument} />;
      }
      case 'pattern':
        let pattern, sequenceElem;
        if (selectedPatternId && selectedPatternId !== '') {
          pattern = component.props.song.patterns[selectedPatternId];
          const closestKey = Object.keys(selectedTrack.sequence).find(
            (timeStr) => parseFloat(timeStr) === selectedSequenceStartTime
          );
          if (closestKey !== undefined) {
            sequenceElem = selectedTrack.sequence[closestKey];
          }
        }
        return <Pattern pattern={pattern} sequenceElem={sequenceElem} />;
    }
  }
  return null;
};

export const SoundTrackInspectorSheet = ({ isOpen, ...props }) => {
  const soundToolState = useCoreState('EDITOR_SOUND_TOOL') || {};
  const [selectedTab, setSelectedTab] = React.useState(TAB_ITEMS[0].value);

  const title = 'Track'; // TODO: track identifier of some kind
  const renderHeader = () => (
    <SoundTrackInspectorHeader
      isOpen={isOpen}
      title={title}
      tabItems={TAB_ITEMS}
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
      soundToolState={soundToolState}
    />
  );

  const renderContent = () =>
    !isOpen ? null : (
      <TrackInspectorTabs soundToolState={soundToolState} selectedTab={selectedTab} />
    );

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
