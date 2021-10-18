import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    marginTop: 3,
  },
  label: {
    ...Constants.styles.textShadow,
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});

export const SocialCount = ({ count, optimisticCount }) => {
  const totalCount = (count ?? 0) + (optimisticCount ?? 0);
  if (!totalCount) return null;
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.label}>{totalCount}</Text>
    </View>
  );
};
