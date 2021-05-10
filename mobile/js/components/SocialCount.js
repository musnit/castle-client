import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const countStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 6,
    bottom: 2,
    paddingHorizontal: 4,
    paddingTop: 2,
    paddingBottom: 2,
    backgroundColor: '#000',
    borderRadius: 2,
    minWidth: 12,
  },

  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export const SocialCount = ({ count, optimisticCount }) => {
  const totalCount = (count ?? 0) + (optimisticCount ?? 0);
  if (!totalCount) return null;
  return (
    <View style={countStyles.container} pointerEvents="none">
      <Text style={countStyles.label}>{totalCount}</Text>
    </View>
  );
};
