import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    height: 36,
    borderRadius: 6,
    borderColor: '#000',
    borderWidth: 1,
    backgroundColor: '#fff',
    width: '100%',
    marginBottom: 8,
  },
});

export const OverlayLayout = () => {
  return <View style={styles.container} />;
};
