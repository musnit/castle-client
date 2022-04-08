import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../Session';

import * as Constants from '../Constants';
import FastImage from 'react-native-fast-image';

import FeatherIcon from 'react-native-vector-icons/Feather';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Constants.colors.grayOnBlackBorder,
    borderRadius: 4,
    flexDirection: 'row',
  },
  content: {
    marginLeft: 16,
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

export const RecoverUnsavedWorkAlert = ({ context }) => {
  const { editorCrashState } = useSession();
  const { status } = editorCrashState || {};

  let message;
  if (status === 'hasRecovered' && context === 'recovered') {
    message = 'Visit the Recovered tab to pick up where you left off.';
  } else if (status === 'hasBackup' && context === 'backup') {
    message = (
      <>
        <Text>Visit the Backups tab in the </Text>
        <FeatherIcon name="settings" size={16} />
        <Text> menu in the editor to pick up where you left off.</Text>
      </>
    );
  } else {
    return null;
  }

  return (
    <View style={styles.container}>
      <FastImage
        style={{ width: 26, height: 30 }}
        source={require('../../assets/images/emoji/chair-white.png')}
      />
      <View style={styles.content}>
        <Text style={styles.heading}>Did Castle exit with unsaved work?</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};
