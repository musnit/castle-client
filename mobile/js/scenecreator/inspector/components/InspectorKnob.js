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
  gauge: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  gaugeDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    marginLeft: -2,
    marginTop: -2,
    borderRadius: 2,
    borderWidth: 1,
    backgroundColor: '#000',
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
    width: 10,
    height: 10,
    borderRadius: 8,
    backgroundColor: '#000',
    position: 'relative',
    left: '33%',
  },
});

const GAUGE_NUM_DOTS = 18;
const GAUGE_DOTS = Array(GAUGE_NUM_DOTS).fill(0);

const numberToText = (number, decimalDigits = 2) => {
  if (typeof number !== 'number') {
    return '0';
  }
  return parseFloat(number.toFixed(decimalDigits)).toString();
};

// knob doesn't spin all 360 degrees, it has some dead space to either side of zero
const ZERO_ANGLE_BUFFER = 40;

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

const addAngleClamp = (angle, addAngle) => {
  const minAngle = ZERO_ANGLE_BUFFER,
    maxAngle = 360 - ZERO_ANGLE_BUFFER;
  angle = modAngle(angle);
  angle += addAngle;
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
  angle = addAngleClamp(angle, 0);
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
    updateValueDebounce.current = debounce((newValue) => onChange(newValue), 333);
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
        const total = addAngleClamp(state.total, state.offset);
        const display = total + 90;
        updateValue(total);
        return {
          ...state,
          offset: action.offset,
          display,
          str: `${display}deg`,
        };
      } else if (action.type === 'release') {
        const total = addAngleClamp(state.total, state.offset);
        const display = total + 90;
        updateValue(total);
        return {
          ...state,
          offset: 0,
          total,
          display,
          str: `${display}deg`,
        };
      } else if (action.type === 'reset') {
        // only allow reset if we're not mid-gesture
        if (state.offset === 0) {
          const total = valueToAngle(action.value, min, max);
          return {
            ...state,
            total,
            display: total + 90,
            str: `${total + 90}deg`,
          };
        } else return state;
      }
    },
    {
      total: valueToAngle(value, min, max),
      offset: 0,
      display: valueToAngle(value, min, max) + 90,
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
        <View style={styles.gauge}>
          <Animated.View style={[styles.rotating, { transform: [{ rotate: rotationState.str }] }]}>
            <View style={styles.innerPointer} />
          </Animated.View>
          {GAUGE_DOTS.map((_, index) => {
            const angleDeg = valueToAngle(index, 0, GAUGE_NUM_DOTS - 1) + 90;
            const angle = angleDeg * (Math.PI / 180);
            const left = 36 + 36 * Math.cos(angle),
              top = 36 + 36 * Math.sin(angle);
            const isFilled = angleDeg <= rotationState.display;
            return (
              <View
                key={`gauge-dot-${index}`}
                style={[
                  styles.gaugeDot,
                  {
                    left,
                    top,
                    backgroundColor: isFilled ? '#000' : '#fff',
                    borderColor: isFilled ? '#000' : '#bbb',
                  },
                ]}
              />
            );
          })}
        </View>
        <Text style={styles.valueLabel}>{valueLabel}</Text>
      </Animated.View>
    </PanGestureHandler>
  );
};
