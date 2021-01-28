import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  empty: {
    width: '100%',
    padding: 8,
    paddingTop: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  error: {
    fontSize: 16,
    lineHeight: 24,
    color: '#fff',
    paddingHorizontal: 16,
  },
});

const formatError = (error) => {
  let message;
  if (error?.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  if (message) {
    if (message.indexOf('Network error') !== -1) {
      message = `There was a problem loading because the app appears to be offline.`;
    }
  } else {
    message = `An unexpected error occurred.`;
  }
  return message;
};

export const EmptyFeed = ({ message, error }) => (
  <View style={styles.empty}>
    <Text style={styles.emptyText}>{message}</Text>
    {error ? <Text style={styles.error}>{formatError(error)}</Text> : null}
  </View>
);
