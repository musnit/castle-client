import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

import * as Constants from '../Constants';

// A line of text in the loader overlay
const LoaderText = ({ children }) => (
  <Text style={{ color: 'white', fontSize: 12 }}>{children}</Text>
);

export const GameLoading = () => (
  <View style={{ width: '100%', height: '100%', alignItems: 'center' }}>
    <ActivityIndicator color="#fff" />
  </View>
);
