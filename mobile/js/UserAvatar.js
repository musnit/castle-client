import React from 'react';
import { View } from 'react-native';

import FastImage from 'react-native-fast-image';

const UserAvatar = ({ url }) => (
  <View
    style={{
      backgroundColor: '#eee',
      borderRadius: 1000000,
      overflow: 'hidden',
    }}>
    <FastImage
      style={{
        width: '100%',
        aspectRatio: 1,
      }}
      source={{ uri: url }}
    />
  </View>
);

export default UserAvatar;
