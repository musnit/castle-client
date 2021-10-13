import * as React from 'react';
import { Animated, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SheetBackgroundOverlay = ({ onPress }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(opacity, { toValue: 0.75, duration: 250, useNativeDriver: true }).start();
  }, []);
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View
        style={{
          position: 'absolute',
          top: useSafeAreaInsets().top,
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          opacity,
        }}
      />
    </TouchableWithoutFeedback>
  );
};
