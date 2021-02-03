import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

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
  authButton: {
    marginTop: 16,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: Constants.colors.white,
    borderRadius: 4,
    padding: 8,
  },
  authButtonLabel: {
    color: Constants.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export const AuthPrompt = ({ message }) => {
  const { navigate } = useNavigation();
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>You're using Castle as a guest.</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <TouchableOpacity
        style={styles.authButton}
        onPress={() => navigate('AuthNavigator', { screen: 'LoginScreen' })}>
        <Text style={styles.authButtonLabel}>Sign in to Castle</Text>
      </TouchableOpacity>
    </View>
  );
};
