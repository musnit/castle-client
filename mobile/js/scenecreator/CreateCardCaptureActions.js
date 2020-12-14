import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CARD_BOTTOM_MIN_HEIGHT } from './CreateCardBottomActions';
import { useGhostUI } from '../ghost/GhostUI';

import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import * as Constants from '../Constants';

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
});

export const CreateCardCaptureActions = () => {
  const { globalActions: data, sendGlobalAction } = useGhostUI();
  return (
    <View style={styles.actions}>
      <TouchableOpacity
        style={Constants.styles.secondaryButton}
        disabled={!data.actionsAvailable.startCapture}
        onPress={() => sendGlobalAction('startCapture')}>
        <MCIcon
          name="circle-slice-8"
          size={22}
          style={Constants.styles.secondaryButtonIconLeft}
          color={data.actionsAvailable.startCapture ? '#fff' : '#666'}
        />
        <Text style={Constants.styles.secondaryButtonLabel}>Record Preview</Text>
      </TouchableOpacity>
    </View>
  );
};
