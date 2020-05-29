import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeArea } from 'react-native-safe-area-context';

import * as Constants from './Constants';
import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  createButton: {
    backgroundColor: 'transparent',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    padding: 4,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonlabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    paddingTop: 4,
    ...Constants.styles.textShadow,
  },
});

const CreateButton = ({ style, onPress }) => (
  <TouchableOpacity style={[styles.createButton, style]} onPress={onPress}>
    <FastImage
      tintColor="#ffffff"
      style={{
        width: 36,
        height: 36,
        ...Constants.styles.dropShadow,
      }}
      source={require('../assets/images/HomeOverlay-create.png')}
    />
    <Text style={styles.buttonlabel}>Create</Text>
  </TouchableOpacity>
);

const ProfileButton = ({ style, onPress }) => (
  <TouchableOpacity style={[styles.profileButton, style]} onPress={onPress}>
    <FastImage
      tintColor="#ffffff"
      style={{
        width: 36,
        height: 36,
        ...Constants.styles.dropShadow,
      }}
      source={require('../assets/images/HomeOverlay-profile.png')}
    />
    <Text style={styles.buttonlabel}>Profile</Text>
  </TouchableOpacity>
);

const HomeOverlay = () => {
  const insets = useSafeArea();
  const navigation = useNavigation();
  return (
    <React.Fragment>
      <ProfileButton
        style={{ position: 'absolute', left: 16, bottom: insets.bottom + 16 }}
        onPress={() => navigation.navigate('Profile')}
      />
      <CreateButton
        style={{ position: 'absolute', right: 16, bottom: insets.bottom + 16 }}
        onPress={() => navigation.navigate('Create')}
      />
    </React.Fragment>
  );
};

export default HomeOverlay;
