import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

import debounce from 'lodash.debounce';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 16,
    lineHeight: 22,
  },
  rotating: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerPointer: {
    width: 12,
    height: 12,
    borderRadius: 8,
    backgroundColor: '#000',
    position: 'relative',
    left: '33%',
  },
});

const numberToText = (number, decimalDigits = 3) => {
  if (typeof number !== 'number') {
    return '0';
  }
  return parseFloat(number.toFixed(decimalDigits)).toString();
};

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

export const InspectorKnob = ({ value, lastNativeUpdate, onChange, min, max, style }) => {
  if (typeof min !== 'number' || typeof max !== 'number') {
    console.warn(`Trying to render a knob with absent or non-numeric min or max`);
    min = 0;
    max = 1;
  }
  const [valueLabel, setValueLabel] = React.useState(numberToText(value));

  // don't spam owning component with tons of updates when dragging
  const updateValueDebounce = React.useRef();
  React.useEffect(() => {
    updateValueDebounce.current = debounce((newValue) => onChange(newValue), 100);
  }, [onChange]);

  const updateValue = React.useCallback(
    (rotationStateTotal) => {
      const newValue = angleToValue(rotationStateTotal, min, max);
      setValueLabel(numberToText(newValue));
      if (updateValueDebounce.current) {
        updateValueDebounce.current(newValue);
      }
    },
    [min, max, setValueLabel]
  );

  // TODO: there's probably some fancy way to do this on the ui thread with Animated
  const [rotationState, setRotationState] = React.useReducer(
    (state, action) => {
      if (action.type === 'move') {
        // add 90 when displaying to orient zero downward
        const total = clampAngle(state.total + state.offset);
        const displayAngle = total + 90;
        updateValue(total);
        return {
          ...state,
          offset: action.offset,
          str: `${displayAngle}deg`,
        };
      } else if (action.type === 'release') {
        const total = clampAngle(state.total + state.offset);
        const displayAngle = total + 90;
        updateValue(total);
        return {
          ...state,
          offset: 0,
          total,
          str: `${displayAngle}deg`,
        };
      } else if (action.type === 'reset') {
        // only allow reset if we're not mid-gesture
        if (state.offset === 0) {
          return {
            total: valueToAngle(action.value, min, max),
            str: `${valueToAngle(action.value, min, max) + 90}deg`,
          };
        } else return state;
      }
    },
    {
      total: valueToAngle(value, min, max),
      offset: 0,
      str: `${valueToAngle(value, min, max) + 90}deg`,
    }
  );

  // refresh display if we got a new value from the engine
  React.useEffect(() => {
    setValueLabel(numberToText(value));
    setRotationState({ type: 'reset', value });
  }, [lastNativeUpdate]);

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
  }, [setRotationState]);

  const onPanGestureEvent = Animated.event([{ nativeEvent: { translationY: translateY } }], {
    useNativeDriver: true,
  });

  const onPanStateChange = React.useCallback(
    (event) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        setRotationState({ type: 'release' });
      }
    },
    [setRotationState]
  );

  return (
    <PanGestureHandler onGestureEvent={onPanGestureEvent} onHandlerStateChange={onPanStateChange}>
      {/* Need an outer Animated.View that does not rotate, because the pan gesture's `translateY` is computed in terms of this view's coordinates, so rotating it would mess up that frame of reference. */}
      <Animated.View style={[styles.container, style]}>
        <Animated.View style={[styles.rotating, { transform: [{ rotate: rotationState.str }] }]}>
          <View style={styles.innerPointer} />
        </Animated.View>
        <Text style={styles.valueLabel}>{valueLabel}</Text>
      </Animated.View>
    </PanGestureHandler>
  );
};
