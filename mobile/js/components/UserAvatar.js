import React from 'react';
import { View } from 'react-native';
import * as Constants from '../Constants';

import FastImage from 'react-native-fast-image';

export const UserAvatar = ({ url, shadow }) => {
  let wrapperStyles = {
    backgroundColor: '#000',
    borderRadius: 1000000,
  };
  if (shadow) {
    wrapperStyles = { ...wrapperStyles, ...Constants.styles.dropShadow };
  }

  return (
    <View style={wrapperStyles}>
      <FastImage
        style={{
          width: '100%',
          aspectRatio: 1,
          borderRadius: 1000000,
        }}
        source={{ uri: url }}
      />
    </View>
  );
};
