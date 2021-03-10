import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../Session';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  links: {
    flexDirection: 'row',
  },
  link: {
    fontSize: 16,
    color: Constants.colors.grayText,
    paddingHorizontal: 16,
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
      <TouchableOpacity onPress={() => Linking.openURL(Constants.DISCORD_INVITE_LINK)}>
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
