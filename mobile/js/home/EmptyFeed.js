import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  error: {
    fontSize: 16,
    lineHeight: 24,
    color: '#fff',
    paddingHorizontal: 16,
  },
  refreshButton: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginVertical: 64,
  },
  refreshText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
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

export const EmptyFeed = ({ message, error, onRefresh }) => (
  <View
    style={{
      ...Constants.styles.empty,
      marginTop: Constants.FEED_HEADER_HEIGHT,
      alignItems: 'center',
    }}>
    <Text style={Constants.styles.emptyText}>{message}</Text>
    {error ? <Text style={styles.error}>{formatError(error)}</Text> : null}
    {onRefresh ? (
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Text style={styles.refreshText}>Reload</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);
