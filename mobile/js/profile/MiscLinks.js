import React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { useSession } from '../Session';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  links: {
    flexDirection: 'row',
  },
  link: {
    fontSize: 16,
    color: Constants.colors.grayText,
    paddingHorizontal: 12,
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
      <TouchableOpacity onPress={() => Linking.openURL('https://castle.xyz/colophon')}>
        <Text style={styles.link}>Colophon</Text>
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
