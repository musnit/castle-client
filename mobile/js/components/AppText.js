import React from 'react';
import { StyleSheet, Text } from 'react-native';

const base = StyleSheet.create({
  text: {
    fontFamily: 'BaltoTrial-Book',
  },
});

export const AppText = ({ style, children, ...props }) => {
  let styles;
  if (Array.isArray(style)) {
    styles = [base.text, ...style];
  } else {
    styles = [base.text, style];
  }
  return (
    <Text {...props} style={styles}>
      {children}
    </Text>
  );
};
