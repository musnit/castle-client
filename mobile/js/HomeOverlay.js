import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeArea } from 'react-native-safe-area-context';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  createButton: {
    backgroundColor: 'transparent',
    padding: 4,
  },
  profileButton: {
    backgroundColor: '#fff',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const CreateButton = ({ style, onPress }) => (
  <TouchableOpacity style={[styles.createButton, style]} onPress={onPress}>
    <FastImage
      style={{
        width: 48,
        height: 48,
      }}
      source={require('../assets/images/add-card.png')}
    />
    <Text>Create</Text>
  </TouchableOpacity>
);

const ProfileButton = ({ style, onPress }) => (
  <TouchableOpacity style={[styles.profileButton, style]} onPress={onPress}>
    <FastImage
      style={{ width: 24, height: 24 }}
      source={require('../assets/images/single-neutral-shield.png')}
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
