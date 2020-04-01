import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  createButton: {
    backgroundColor: 'transparent',
    padding: 4,
  },
  image: {
    width: 48,
    height: 48,
  },
});

const CreateButton = ({ style }) => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={[styles.createButton, style]}
      onPress={() => navigation.navigate('Create')}>
      <FastImage style={styles.image} source={require('../assets/images/add-card.png')} />
      <Text>Create</Text>
    </TouchableOpacity>
  );
};

export default CreateButton;
