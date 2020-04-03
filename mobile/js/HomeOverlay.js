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
    width: 40,
    height: 40,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createLabel: {
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
        width: 48,
        height: 48,
        ...Constants.styles.dropShadow,
      }}
      source={require('../assets/images/add-card.png')}
    />
    <Text style={styles.createLabel}>Create</Text>
  </TouchableOpacity>
);

const ProfileButton = ({ style, onPress }) => (
  <TouchableOpacity style={[styles.profileButton, style]} onPress={onPress}>
    <FastImage
      style={{ width: 32, height: 32 }}
      source={require('../assets/images/feed-profile.png')}
    />
  </TouchableOpacity>
);

const HomeOverlay = () => {
  const insets = useSafeArea();
  const navigation = useNavigation();
  return (
    <React.Fragment>
      <ProfileButton
        style={{ position: 'absolute', left: 16, top: insets.top + 16 }}
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
