import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingBottom: 16,
  },
});

export const AuthHeader = () => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <FastImage
        style={{
          width: 100,
          aspectRatio: 1,
          marginBottom: 16,
        }}
        source={require('../../assets/images/castle-icon-onblack.png')}
      />
      <FastImage
        style={{
          width: 100,
          height: 34,
          marginBottom: 16,
        }}
        source={require('../../assets/images/castle-wordmark-onblack.png')}
      />
    </View>
  );
};
