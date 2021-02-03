import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 16,
    color: Constants.colors.white,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: Constants.colors.white,
  },
});

export const AuthPrompt = ({ message }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>You're using Castle as a guest.</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};
