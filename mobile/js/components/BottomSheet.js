import React from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Platform,
  requireNativeComponent,
  ScrollView,
  DeviceEventEmitter,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeArea } from 'react-native-safe-area-context';
import { useKeyboard } from '../common/utilities';
import { AndroidNavigationContext } from '../ReactNavigation';

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

let NativeBottomSheet = null;

if (Platform.OS == 'android') {
  NativeBottomSheet = requireNativeComponent('CastleBottomSheet', null);
}

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
  headerHeight = 64,
  contentKey = 'content', // change this to reset the scrollview
  scrollViewRef = null,
  onClose,
  onCloseEnd,
  onOpenEnd,
  style = {},
}) => {
  let screenHeight = Viewport.vh * 100;
  if (Platform.OS == 'android') {
    const { navigatorWindowHeight } = React.useContext(AndroidNavigationContext);
    screenHeight = navigatorWindowHeight;
  }

  const textInputHeight = 48; // approx height of one text input

  if (Platform.OS == 'android') {
    const [viewId] = React.useState(Math.floor(Math.random() * 1000000));

    const [containerHeight, setContainerHeight] = React.useState(screenHeight);
    const [scrollViewPadding, setScrollViewPadding] = React.useState(0);
    React.useEffect(() => {
      let subscription = DeviceEventEmitter.addListener('CastleBottomSheetEvent', (event) => {
        if (event.viewId !== viewId) {
          return;
        }

        if (event.type == 'height') {
          setContainerHeight(event.height);
        }

        if (event.type == 'scrollViewPadding') {
          setScrollViewPadding(event.padding);
        }
      });

      return () => {
        subscription.remove();
      };
    });

    // onCloseEnd, onOpenEnds aren't implemented yet, but they're not used for anything other than
    // closing the keyboard which the native component already handles
    // add 20 to padding to fix issue on Remy's phone
    return (
      <NativeBottomSheet
        style={styles.container}
        viewId={viewId}
        isOpen={isOpen}
        screenHeight={screenHeight}
        snapPoints={snapPoints}
        initialSnap={initialSnap}
        persistLastSnapWhenOpened={persistLastSnapWhenOpened}
        headerHeight={headerHeight}
        textInputHeight={textInputHeight}>
        <View style={[styles.container, style, { height: containerHeight }]} key={contentKey}>
          {renderHeader()}
          <ScrollView style={styles.content}>
            {renderContent()}
            <View style={{ height: scrollViewPadding + 20 }} />
          </ScrollView>
        </View>
      </NativeBottomSheet>
    );
  }

  const insets = useSafeArea();
  let lastSnap = React.useRef(initialSnap);
  const [keyboardState] = useKeyboard();

  // translation from bottom of the screen
  let snapY = React.useRef(new Animated.Value(screenHeight)).current;
  const [containerHeight, setContainerHeight] = React.useState(0);

  const onPanGestureEvent = Animated.event([{ nativeEvent: { absoluteY: snapY } }], {
    useNativeDriver: true,
  });

  const snapTo = React.useCallback(
    (toValue, velocity = 0, onFinished) => {
      // containerHeight < 1 causes layout bugs on Android.
      const newContainerHeight = Math.max(1, screenHeight - toValue);
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
        let dist = Math.abs(screenHeight - snapPoints[ii] - y);
        if (dist < minDist) {
          minDist = dist;
          minIndex = ii;
        }
      }
      const signDist = y - (screenHeight - snapPoints[minIndex]);
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
      return snapTo(screenHeight - snapPoints[minIndex], velocity);
    },
    [snapTo, snapPoints, persistLastSnapWhenOpened]
  );

  React.useEffect(() => {
    if (isOpen) {
      snapTo(screenHeight - snapPoints[lastSnap.current], 0, onOpenEnd);
    } else {
      snapY.flattenOffset();
      snapTo(screenHeight, 0, onCloseEnd);
    }
  }, [isOpen, snapPoints[lastSnap.current], onOpenEnd, onCloseEnd]);

  const onPanStateChange = React.useCallback(
    (event) => {
      if (Platform.OS === 'android') {
        if (
          event.nativeEvent.oldState === State.ACTIVE &&
          event.nativeEvent.state === State.ACTIVE
        ) {
          snapY.setOffset(-event.nativeEvent.y);
          snapY.setValue(event.nativeEvent.absoluteY);
        }
      } else {
        if (event.nativeEvent.state === State.BEGAN) {
          snapY.setOffset(-event.nativeEvent.y);
          snapY.setValue(event.nativeEvent.absoluteY);
        }
      }
      if (event.nativeEvent.state === State.END) {
        if (Platform.OS !== 'android' || event.nativeEvent.oldState !== State.BEGAN) {
          const { absoluteY, velocityY } = event.nativeEvent;
          snapY.flattenOffset();
          snapToClosest(absoluteY, velocityY);
        }
      }
    },
    [snapToClosest]
  );

  React.useEffect(() => {
    if (
      isOpen &&
      keyboardState.visible &&
      containerHeight < keyboardState.height + headerHeight + textInputHeight
    ) {
      snapToClosest(
        screenHeight - containerHeight - keyboardState.height - headerHeight - textInputHeight,
        0
      );
    }
  }, [keyboardState, isOpen, snapToClosest]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: snapY }] }, style]}>
      {/* inner view constrains the height of the scrollview to the bottom of the screen. */}
      <View style={{ height: containerHeight }}>
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanStateChange}>
          <Animated.View>{renderHeader()}</Animated.View>
        </PanGestureHandler>
        <KeyboardAwareScrollView
          ref={scrollViewRef}
          key={contentKey}
          style={styles.content}
          enableOnAndroid={true}
          extraScrollHeight={Constants.Android ? insets.bottom : 0}
          keyboardShouldPersistTaps="handled">
          {renderContent()}
          <View style={{ paddingBottom: insets.bottom }}></View>
        </KeyboardAwareScrollView>
      </View>
    </Animated.View>
  );
};
