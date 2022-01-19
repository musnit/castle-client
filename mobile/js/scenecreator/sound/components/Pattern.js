import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    color: '#000',
  },
});

export const Pattern = ({ pattern, sequenceElem }) => {
  if (pattern) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{pattern.patternId}</Text>
      </View>
    );
  }
  return null;
};
