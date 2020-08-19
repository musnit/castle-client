import React, { Fragment } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';

import { BottomSheetHeader } from '../components/BottomSheetHeader';
import { BottomSheet } from '../components/BottomSheet';
import Viewport from '../common/viewport';
import { useSession } from '../Session';

import * as Constants from '../Constants';

const SHEET_HEIGHT = 100 * Viewport.vh - 100;

const styles = StyleSheet.create({
  container: {},
  links: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  link: {
    fontSize: 16,
    color: Constants.colors.grayText,
  },
});

export const ProfileSettingsSheet = ({ isOpen, onClose }) => {
  const { signOutAsync, userId: signedInUserId } = useSession();

  const renderHeader = () => <BottomSheetHeader title='Settings' onClose={onClose} />;

  const renderContent = () => (
    <View style={styles.container}>
      <View style={styles.links}>
        <TouchableOpacity onPress={signOutAsync}>
          <Text style={styles.link}>Log out</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://discord.gg/rQETB4H')}>
          <Text style={styles.link}>Discord</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://castle.xyz/terms')}>
          <Text style={styles.link}>Terms</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://castle.xyz/privacy_policy')}>
          <Text style={styles.link}>Privacy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <BottomSheet
      snapPoints={[SHEET_HEIGHT]}
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
      style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
        borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
        ...Constants.styles.dropShadowUp,
      }}
    />
  );
};
