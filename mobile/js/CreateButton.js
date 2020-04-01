import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const styles = StyleSheet.create({
  createButton: {
    position: 'absolute',
    backgroundColor: '#f00',
    padding: 8,
    right: 32,
    bottom: 32,
  },
});

const CreateButton = () => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('Create')}>
      <Text>Create</Text>
    </TouchableOpacity>
  );
};

export default CreateButton;
