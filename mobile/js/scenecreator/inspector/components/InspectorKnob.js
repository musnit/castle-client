import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
  rotating: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerPointer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000',
    position: 'relative',
    left: 32,
  },
});

const ZERO_ANGLE_BUFFER = 20;

// RN rotation:
//
//     270
// 180     0
//     90

const modAngle = (angle) => {
  while (angle < 0) angle += 360;
  while (angle > 360) angle -= 360;
  return angle;
};

const clampAngle = (angle) => {
  const minAngle = ZERO_ANGLE_BUFFER,
    maxAngle = 360 - ZERO_ANGLE_BUFFER;
  angle = modAngle(angle);
  if (angle < minAngle) angle = minAngle;
  if (angle > maxAngle) angle = maxAngle;
  return angle;
};

const valueToAngle = (value, min, max) => {
  const minAngle = ZERO_ANGLE_BUFFER,
    maxAngle = 360 - ZERO_ANGLE_BUFFER;
  const valueInterp = (value - min) / (max - min);
  return minAngle + valueInterp * (maxAngle - minAngle);
};

const angleToValue = (angle, min, max) => {
  const minAngle = ZERO_ANGLE_BUFFER,
    maxAngle = 360 - ZERO_ANGLE_BUFFER;
  angle = clampAngle(angle);
  const angleInterp = (angle - minAngle) / (maxAngle - minAngle);
  return min + angleInterp * (max - min);
};

// TODO: lastNativeUpdate?
export const InspectorKnob = ({ value, min, max }) => {
  // TODO: there's probably some fancy way to do this on the ui thread with Animated
  const [rotationState, setRotationState] = React.useReducer(
    (state, action) => {
      if (action.type === 'move') {
        // add 90 when displaying to orient zero downward
        const displayAngle = clampAngle(state.total + state.offset) + 90;
        return {
          ...state,
          offset: action.offset,
          str: `${displayAngle}deg`,
        };
      } else if (action.type === 'release') {
        const total = clampAngle(state.total + state.offset);
        const displayAngle = total + 90;
        console.log(`angle to new value: ${total} -> ${angleToValue(total, min, max)}`);
        return {
          ...state,
          offset: 0,
          total,
          str: `${displayAngle}deg`,
        };
      }
    },
    {
      total: valueToAngle(value, min, max),
      offset: 0,
      str: `${valueToAngle(value, min, max)}deg`,
    }
  );
  let translateY = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const handle = translateY.addListener(({ value }) => {
      setRotationState({
        type: 'move',
        offset: -value,
      });
    });
    return () => {
      translateY.removeListener(handle);
    };
  }, [translateY, setRotationState]);

  const onPanGestureEvent = Animated.event([{ nativeEvent: { translationY: translateY } }], {
    useNativeDriver: true,
  });

  const onPanStateChange = React.useCallback(
    (event) => {
      // console.log(`Pan state: ${event.nativeEvent.oldState} -> ${event.nativeEvent.state}`);
      if (event.nativeEvent.oldState === State.ACTIVE) {
        setRotationState({ type: 'release' });
      }
      // console.log(JSON.stringify(event.nativeEvent, null, 2));
      // state.ACTIVE, state.BEGAN
    },
    [setRotationState]
  );

  return (
    <PanGestureHandler onGestureEvent={onPanGestureEvent} onHandlerStateChange={onPanStateChange}>
      {/* Need an outer Animated.View that does not rotate, because the pan gesture's `translateY` is computed in terms of this view's coordinates, so rotating it would mess up that frame of reference. */}
      <Animated.View>
        <Animated.View style={[styles.rotating, { transform: [{ rotate: rotationState.str }] }]}>
          <View style={styles.innerPointer} />
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};
