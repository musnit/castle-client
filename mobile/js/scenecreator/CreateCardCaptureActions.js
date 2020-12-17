import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CARD_BOTTOM_MIN_HEIGHT } from './CreateCardBottomActions';
import { useGhostUI } from '../ghost/GhostUI';

import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import * as Constants from '../Constants';

const ENABLE_CAPTURE = true;

const styles = StyleSheet.create({
  actions: {
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: CARD_BOTTOM_MIN_HEIGHT,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  status: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
});

const RecordIcon = ({ color }) => (
  <MCIcon
    name="circle-slice-8"
    size={22}
    style={Constants.styles.secondaryButtonIconLeft}
    color={color}
  />
);

export const CreateCardCaptureActions = () => {
  if (!ENABLE_CAPTURE) return null;

  const { globalActions: data, sendGlobalAction } = useGhostUI();
  const [capturing, setCapturing] = React.useState(false);
  const [recordState, setNextRecordState] = React.useReducer(
    (state) => {
      switch (state.status) {
        case 'ready':
          return { status: 'countdown', countdown: 3 };
        case 'countdown':
          if (state.countdown === 1) {
            return { status: 'recording', countdown: 0 };
          } else {
            return { status: 'countdown', countdown: state.countdown - 1 };
          }
        case 'recording':
          return { status: 'ready' };
      }
      return state;
    },
    { status: 'ready' }
  );

  React.useEffect(() => {
    let timeout;
    if (capturing && recordState.status !== 'recording') {
      timeout = setTimeout(() => {
        setNextRecordState();
        if (recordState.status === 'countdown' && recordState.countdown === 1) {
          sendGlobalAction('startCapture');
        }
      }, 1000);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    };
  }, [recordState, capturing]);

  const startCapture = React.useCallback(() => {
    setCapturing(true);
    setNextRecordState();
  }, []);

  return (
    <View style={styles.actions}>
      {recordState.status === 'ready' ? (
        <TouchableOpacity
          style={Constants.styles.secondaryButton}
          disabled={!data.actionsAvailable.startCapture}
          onPress={startCapture}>
          <RecordIcon color={data.actionsAvailable.startCapture ? '#fff' : '#666'} />
          <Text style={Constants.styles.secondaryButtonLabel}>Record Preview</Text>
        </TouchableOpacity>
      ) : recordState.status === 'countdown' ? (
        <View style={styles.status}>
          <RecordIcon color="#888" />
          <Text style={styles.statusText}>Recording begins in {recordState.countdown}...</Text>
        </View>
      ) : recordState.status === 'recording' ? (
        <View style={styles.status}>
          <RecordIcon color="#f00" />
          <Text style={styles.statusText}>Recording</Text>
        </View>
      ) : null}
    </View>
  );
};
