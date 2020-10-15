import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { PopoverButton } from '../scenecreator/PopoverProvider';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  badge: {
    width: 48,
    height: 48,
    marginRight: 8,
  },
  button: {},
  tooltip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 16,
    lineHeight: 22,
  },
});

const Tooltip = ({ message }) => <Text style={styles.tooltip}>{message}</Text>;

export const ProfileBadge = ({ badge, style }) => {
  const popover = {
    Component: Tooltip,
    message: badge?.label,
    height: 38,
  };
  return (
    <PopoverButton popover={popover}>
      <FastImage style={[styles.badge, style]} source={{ uri: badge.image?.url }} />
    </PopoverButton>
  );
};
