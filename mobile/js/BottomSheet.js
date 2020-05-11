import React from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

import Viewport from './viewport';

const SPRING_CONFIG = {
  tension: 150,
  friction: 50,
  overshootClamping: true,
  restDisplacementThreshold: 1,
  restSpeedThreshold: 1,
  useNativeDriver: true,
};

const SNAP_VELOCITY = 72;
const SCREEN_HEIGHT = Viewport.vh * 100;

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
  renderHeader = () => null,
  renderContent = () => null,
  onClose,
  onCloseEnd,
  onOpenEnd,
  style = {},
}) => {
  // translation from bottom of the screen
  let snapY = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [containerHeight, setContainerHeight] = React.useState(0);

  const onPanGestureEvent = Animated.event([{ nativeEvent: { absoluteY: snapY } }], {
    useNativeDriver: true,
  });

  const snapTo = React.useCallback(
    (toValue, onFinished) => {
      const newContainerHeight = SCREEN_HEIGHT - toValue;
      if (containerHeight < newContainerHeight) {
        setContainerHeight(newContainerHeight);
      }
      Animated.spring(snapY, { toValue, ...SPRING_CONFIG }).start(({ finished }) => {
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
      /*
TODO: compute startIndex
      if (minIndex == startIndex && velocity < -SNAP_VELOCITY && minIndex > 0) {
        minIndex -= 1;
      } else if (minIndex == startIndex && velocity > SNAP_VELOCITY && minIndex < snapPoints.length - 1) {
        minIndex += 1;
      }
*/
      return snapTo(SCREEN_HEIGHT - snapPoints[minIndex]);
    },
    [snapTo, snapPoints]
  );

  React.useEffect(() => {
    if (isOpen) {
      snapTo(SCREEN_HEIGHT - snapPoints[initialSnap], onOpenEnd);
    } else {
      snapTo(SCREEN_HEIGHT, onCloseEnd);
    }
  }, [isOpen, snapTo, onOpenEnd, onCloseEnd]);

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

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: snapY }] }, style]}>
      {/* inner view constrains the height of the scrollview to the bottom of the screen. */}
      <View style={{ height: containerHeight }}>
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanStateChange}>
          <Animated.View>{renderHeader()}</Animated.View>
        </PanGestureHandler>
        <ScrollView style={styles.content}>{renderContent()}</ScrollView>
      </View>
    </Animated.View>
  );
};
