import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeArea } from 'react-native-safe-area-context';
import { useKeyboard } from '../common/utilities';

import Viewport from '../common/viewport';

import * as Constants from '../Constants';

const SPRING_CONFIG = {
  tension: 150,
  friction: 50,
  overshootClamping: true,
  restDisplacementThreshold: 1,
  restSpeedThreshold: 1,
  useNativeDriver: true,
};

const SCREEN_HEIGHT = Viewport.vh * 100;
const SWIPE_MIN_VELOCITY = 128;
const SWIPE_MIN_DISTANCE = 64;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
});

/**
 *  @prop isOpen whether the bottom sheet is open (and therefore visible)
 *  @prop snapPoints ascending list of snap points measured from the bottom of the screen
 *  @prop initialSnap index into snapPoints to use when opening the sheet
 */
export const BottomSheet = ({
  isOpen = false,
  snapPoints = [32, 256],
  initialSnap = 0,
  persistLastSnapWhenOpened = false,
  renderHeader = () => null,
  renderContent = () => null,
  onClose,
  onCloseEnd,
  onOpenEnd,
  style = {},
}) => {
  const insets = useSafeArea();
  let lastSnap = React.useRef(initialSnap);
  const [keyboardState] = useKeyboard();

  // translation from bottom of the screen
  let snapY = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [containerHeight, setContainerHeight] = React.useState(0);

  const onPanGestureEvent = Animated.event([{ nativeEvent: { absoluteY: snapY } }], {
    useNativeDriver: true,
  });

  const snapTo = React.useCallback(
    (toValue, velocity = 0, onFinished) => {
      const newContainerHeight = SCREEN_HEIGHT - toValue;
      if (containerHeight < newContainerHeight) {
        setContainerHeight(newContainerHeight);
      }
      Animated.spring(snapY, { toValue, velocity, ...SPRING_CONFIG }).start(({ finished }) => {
        if (finished) {
          onFinished && onFinished();
          if (containerHeight > newContainerHeight) {
            setContainerHeight(newContainerHeight);
          }
        }
      });
    },
    [snapY, containerHeight]
  );

  const snapToClosest = React.useCallback(
    (y, velocity) => {
      let minDist = 9999,
        minIndex = -1;
      for (let ii = 0; ii < snapPoints.length; ii++) {
        let dist = Math.abs(SCREEN_HEIGHT - snapPoints[ii] - y);
        if (dist < minDist) {
          minDist = dist;
          minIndex = ii;
        }
      }
      const signDist = y - (SCREEN_HEIGHT - snapPoints[minIndex]);
      if (
        signDist < -SWIPE_MIN_DISTANCE &&
        velocity < -SWIPE_MIN_VELOCITY &&
        minIndex < snapPoints.length - 1
      ) {
        minIndex += 1;
      } else if (signDist > SWIPE_MIN_DISTANCE && velocity > SWIPE_MIN_VELOCITY && minIndex > 0) {
        minIndex -= 1;
      }
      if (persistLastSnapWhenOpened) {
        lastSnap.current = minIndex;
      }
      return snapTo(SCREEN_HEIGHT - snapPoints[minIndex], velocity);
    },
    [snapTo, snapPoints, persistLastSnapWhenOpened]
  );

  React.useEffect(() => {
    if (isOpen) {
      snapTo(SCREEN_HEIGHT - snapPoints[lastSnap.current], 0, onOpenEnd);
    } else {
      snapY.flattenOffset();
      snapTo(SCREEN_HEIGHT, 0, onCloseEnd);
    }
  }, [isOpen, snapPoints[lastSnap.current], onOpenEnd, onCloseEnd]);

  const onPanStateChange = React.useCallback(
    (event) => {
      if (event.nativeEvent.state === State.BEGAN) {
        snapY.setOffset(-event.nativeEvent.y);
        snapY.setValue(event.nativeEvent.absoluteY);
      }
      if (event.nativeEvent.oldState === State.ACTIVE) {
        const { absoluteY, velocityY } = event.nativeEvent;
        snapY.flattenOffset();
        snapToClosest(absoluteY, velocityY);
      }
    },
    [snapToClosest]
  );

  const headerHeight = 48; // TODO: use as prop

  React.useEffect(() => {
    if (isOpen && keyboardState.visible && containerHeight < keyboardState.height + headerHeight) {
      snapToClosest(SCREEN_HEIGHT - containerHeight - keyboardState.height - headerHeight, 0);
    }
  }, [keyboardState, isOpen, snapToClosest]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: snapY }] }, style]}>
      {/* inner view constrains the height of the scrollview to the bottom of the screen. */}
      {/* containerHeight < 1 causes layout bugs on Android. */}
      <View style={{ height: Math.max(1, containerHeight) }}>
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanStateChange}>
          <Animated.View>{renderHeader()}</Animated.View>
        </PanGestureHandler>
        <KeyboardAwareScrollView
          style={styles.content}
          enableOnAndroid={true}
          extraHeight={Constants.iOS ? containerHeight - headerHeight : 0}
          extraScrollHeight={Constants.Android ? insets.bottom : 0}
          keyboardShouldPersistTaps="handled">
          {renderContent()}
          <View style={{ paddingBottom: insets.bottom }}></View>
        </KeyboardAwareScrollView>
      </View>
    </Animated.View>
  );
};
