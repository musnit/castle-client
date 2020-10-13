import React from 'react';
import { StyleSheet } from 'react-native';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  badge: {
    width: 36,
    height: 36,
    marginRight: 8,
  },
});

export const ProfileBadge = ({ badge, style }) => (
  <FastImage style={[styles.badge, style]} source={{ uri: badge.image?.url }} />
);
