import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CARD_BOTTOM_MIN_HEIGHT } from './CreateCardBottomActions';
import { useGhostUI } from '../ghost/GhostUI';

import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import * as Constants from '../Constants';

const ENABLE_CAPTURE = true;

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
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

  const start = React.useRef();
  const timeout = React.useRef();
  const advanceTimer = React.useCallback(
    (time) => {
      if (!start.current) {
        start.current = time;
      }
      const elapsed = time - start.current;
      let captureStarted = false;
      if (elapsed >= 1000) {
        start.current = time;
        setNextRecordState();
        if (recordState.status === 'countdown' && recordState.countdown === 1) {
          captureStarted = true;
          sendGlobalAction('startCapture');
        }
      }
      if (!captureStarted) {
        timeout.current = requestAnimationFrame(advanceTimer);
      }
    },
    [recordState]
  );

  React.useEffect(() => {
    if (capturing && recordState.status !== 'recording') {
      timeout.current = requestAnimationFrame(advanceTimer);
    }
    return () => {
      if (timeout.current) {
        cancelAnimationFrame(timeout.current);
        timeout.current = null;
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
