import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { CardCreatorBottomSheet } from '../../sheets/CardCreatorBottomSheet';
import { Pattern } from '../components/Pattern';
import { Sampler } from '../components/Sampler';
import { SoundTrackInspectorHeader } from './SoundTrackInspectorHeader';
import { useCoreState, sendAsync } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';
const CastleIcon = Constants.CastleIcon;

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

const TrackInspectorTabs = ({ component, soundToolState, selectedTab }) => {
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

export const SoundTrackInspectorSheet = ({ isOpen }) => {
  const soundToolState = useCoreState('EDITOR_SOUND_TOOL') || {};
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Music') || {
    props: {
      song: {
        patterns: {},
        tracks: [],
      },
    },
  };
  const [selectedTab, setSelectedTab] = React.useState(TAB_ITEMS[0].value);

  const renderHeader = () => (
    <SoundTrackInspectorHeader
      isOpen={isOpen}
      tabItems={TAB_ITEMS}
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
      soundToolState={soundToolState}
      component={component}
    />
  );

  const renderContent = () =>
    !isOpen ? null : (
      <TrackInspectorTabs
        soundToolState={soundToolState}
        component={component}
        selectedTab={selectedTab}
      />
    );

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      headerHeight={88}
      contentKey={`tab-${selectedTab}`}
      extraTopInset={8}
      renderContent={renderContent}
      renderHeader={renderHeader}
      persistLastSnapWhenOpened
    />
  );
};
