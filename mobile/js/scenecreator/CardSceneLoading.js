import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#00000066',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const CardSceneLoading = () => (
  <View style={styles.container}>
    <ActivityIndicator color="#fff" size="large" />
  </View>
);
