import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from './AppText';
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

// https://stackoverflow.com/questions/9461621/format-a-number-as-2-5k-if-a-thousand-or-more-otherwise-900
const lookup = [
  { value: 1, symbol: '' },
  { value: 1e3, symbol: 'k' },
  { value: 1e6, symbol: 'M' },
  { value: 1e9, symbol: 'G' },
  { value: 1e12, symbol: 'T' },
  { value: 1e15, symbol: 'P' },
  { value: 1e18, symbol: 'E' },
];
const formatCount = (num, digits = 1) => {
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find((item) => num >= item.value);
  return item ? (num / item.value).toFixed(digits).replace(rx, '$1') + item.symbol : '0';
};

export const SocialCount = ({ count, optimisticCount }) => {
  const totalCount = (count ?? 0) + (optimisticCount ?? 0);
  if (!totalCount) return null;
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.label}>{formatCount(totalCount)}</Text>
    </View>
  );
};
