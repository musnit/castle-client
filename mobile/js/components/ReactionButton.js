import React from 'react';
import { Animated, Pressable as PressableRN, StyleSheet, Text, View } from 'react-native';

import * as Constants from '../Constants';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import { TouchableNativeFeedback as PressableRNGH } from 'react-native-gesture-handler';

// required because android Pressable doesn't receive touches outside parent container
// waiting for merge: https://github.com/facebook/react-native/pull/29039
const Pressable = Constants.iOS ? PressableRN : PressableRNGH;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = {
  tension: 100,
  friction: 50,
  overshootClamping: true,
  useNativeDriver: true,
};

const styles = StyleSheet.create({
  container: {
    ...Constants.styles.dropShadow,

    // TODO: actual react button
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const countStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: -6,
    bottom: -4,
    padding: 2,
    backgroundColor: '#000',
    borderRadius: 2,
    minWidth: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});

const ReactionCount = ({ reaction }) => {
  if (!reaction?.count) return null;
  return (
    <View style={countStyles.container} pointerEvents="none">
      <Text style={countStyles.label}>{reaction.count}</Text>
    </View>
  );
};

export const ReactionButton = ({ deckId, reactions }) => {
  const buttonScale = React.useRef(new Animated.Value(1)).current;
  const onPress = React.useCallback(() => {
    Animated.stagger(100, [
      Animated.spring(buttonScale, { toValue: 2, ...SPRING_CONFIG }),
      Animated.spring(buttonScale, { toValue: 1, ...SPRING_CONFIG }),
    ]).start();
  }, []);

  let fire;
  if (reactions?.length) {
    fire = reactions.find((reaction) => reaction.reactionId === Constants.reactionIds.fire);
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.container, { transform: [{ scale: buttonScale }] }]}>
      <FontAwesome5 name="fire-alt" size={24} color="#000" />
      <ReactionCount reaction={fire} />
    </AnimatedPressable>
  );
};
