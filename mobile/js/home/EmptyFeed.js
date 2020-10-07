import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  empty: {
    width: '100%',
    padding: 8,
    paddingTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
});

export const EmptyFeed = ({ message }) => (
  <View style={styles.empty}>
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);
