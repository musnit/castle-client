import React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import { TouchableOpacity as RNGHTouchableOpacity } from 'react-native-gesture-handler';

// from here:
// https://github.com/osdnk/react-native-reanimated-bottom-sheet/issues/16#issuecomment-545517697
// delete this disgusting component after this is resolved

export const BottomSheetTouchableWrapper = (props) =>
  Platform.select({
    android: <RNGHTouchableOpacity {...props} />,
    ios: <TouchableOpacity {...props}>{props.children}</TouchableOpacity>,
  });
