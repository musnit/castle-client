import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCardCreator } from './CreateCardContext';
import { useCoreState } from '../core/CoreEvents';
import { useSession } from '../Session';

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
    marginRight: 12,
  },
  status: {
    flexDirection: 'row',
    paddingVertical: 4,
    alignItems: 'center',
  },
});

const RecordIcon = ({ color }) => (
  <MCIcon
    name="circle-slice-8"
    size={30}
    style={Constants.styles.secondaryButtonIconLeft}
    color={color}
  />
);

export const CreateCardCaptureActions = () => {
  if (!ENABLE_CAPTURE) return null;
  const { deck } = useCardCreator();
  const { userId: signedInUserId } = useSession();

  const data = useCoreState('EDITOR_GLOBAL_ACTIONS');
  // TODO: support these actions in core
  const sendGlobalAction = () => {};

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
  }, [recordState, capturing, advanceTimer]);

  const startCapture = React.useCallback(() => {
    setCapturing(true);
    setNextRecordState();
  }, []);

  if (deck?.creator?.userId !== signedInUserId) {
    // disallow capture UI if you don't own this deck
    return null;
  }

  return (
    <View style={styles.actions}>
      {recordState.status === 'ready' ? (
        <TouchableOpacity
          style={styles.status}
          disabled={!data.actionsAvailable.startCapture}
          onPress={startCapture}>
          <Text style={styles.statusText}>Record Preview</Text>
          <RecordIcon color={data.actionsAvailable.startCapture ? '#fff' : '#666'} />
        </TouchableOpacity>
      ) : recordState.status === 'countdown' ? (
        <View style={styles.status}>
          <Text style={styles.statusText}>Recording begins in {recordState.countdown}...</Text>
          <RecordIcon color="#888" />
        </View>
      ) : recordState.status === 'recording' ? (
        <View style={styles.status}>
          <Text style={styles.statusText}>Recording</Text>
          <RecordIcon color="#f00" />
        </View>
      ) : null}
    </View>
  );
};
