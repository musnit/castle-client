import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../Session';

import * as Constants from '../Constants';
import FastImage from 'react-native-fast-image';

import FeatherIcon from 'react-native-vector-icons/Feather';

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Constants.colors.grayOnBlackBorder,
    borderRadius: 8,
    flexDirection: 'row',
  },
  content: {
    marginLeft: 12,
    flex: 1,
  },
  heading: {
    fontSize: 16,
    color: Constants.colors.white,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 16,
    color: Constants.colors.white,
  },
});

export const RecoverUnsavedWorkAlert = ({ context, deckId }) => {
  const { editorCrashState } = useSession();
  const { deckId: deckIdCrashed, status } = editorCrashState || {};

  let message;
  if (status === 'hasRecovered' && context === 'recovered') {
    message = 'Visit the Recovered tab to pick up where you left off.';
  } else if (
    status === 'hasBackup' &&
    context === 'backup' &&
    (!deckIdCrashed || deckId === deckIdCrashed)
  ) {
    message = (
      <>
        <Text>Visit the Backups tab in the </Text>
        <FeatherIcon name="settings" size={16} />
        <Text> menu in the editor to recover your changes.</Text>
      </>
    );
  } else {
    return null;
  }

  return (
    <View style={styles.container}>
      <FastImage
        style={{ width: 26, height: 26, marginTop: 4 }}
        source={require('../../assets/images/emoji/tp-white.png')}
      />
      <View style={styles.content}>
        <Text style={styles.heading}>Did you have unsaved work?</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};
