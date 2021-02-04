import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../Session';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
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

export const MiscLinks = () => {
  const { signOutAsync, isAnonymous } = useSession();
  return (
    <View style={styles.links}>
      {!isAnonymous ? (
        <TouchableOpacity onPress={signOutAsync}>
          <Text style={styles.link}>Log out</Text>
        </TouchableOpacity>
      ) : null}
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
  );
};
