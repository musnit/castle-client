import React from 'react';
import { StyleSheet } from 'react-native';
import { BottomSheet } from '../../../components/BottomSheet';
import { BottomSheetHeader } from '../../../components/BottomSheetHeader';
import { Sampler } from '../components/Sampler';
import { useCoreState, sendAsync } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';

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
  let instrument;
  if (selectedTrackIndex >= 0) {
    instrument = component.props.song.tracks[selectedTrackIndex].instrument;
  }

  const deselectTrack = React.useCallback(() => {
    sendAsync('EDITOR_SOUND_TOOL_ACTION', { action: 'selectTrack', doubleValue: -1 });
  }, []);

  const title = 'Sampler'; // TODO: others
  const renderHeader = () => <BottomSheetHeader title={title} onClose={deselectTrack} />;

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
