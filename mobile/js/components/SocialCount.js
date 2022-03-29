import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from './AppText';
import { formatCount } from '../common/utilities';

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

export const SocialCount = ({ count, optimisticCount, style, textStyle }) => {
  const totalCount = (count ?? 0) + (optimisticCount ?? 0);
  if (!totalCount) return null;
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Text style={[styles.label, textStyle]}>{formatCount(totalCount)}</Text>
    </View>
  );
};
