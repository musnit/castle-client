import * as React from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Platform,
  Keyboard,
} from 'react-native';
import { AppText as Text } from './AppText';
import { useKeyboard } from '../common/utilities';

import Viewport from '../common/viewport';

import * as GhostChannels from '../ghost/GhostChannels';

const { vw, vh } = Viewport;

/**
 * Usage:
 *
 * const MyContentComponent = ({ name }) => <Text>Hello {name}, it's the popover contents</Text>;
 *
 * <PopoverButton popover={{ Component: MyContentComponent, name: 'ben' }} style={blah}>
 *   <Text>This button launches a popover next to itself when pressed</Text>
 * </PopoverButton>
 */

const styles = StyleSheet.create({
  boundary: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  popover: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 1,
  },
  empty: {
    padding: 16,
  },
});

const PopoverContext = React.createContext({});
export const usePopover = () => React.useContext(PopoverContext);

const PopoverEmptyContents = () => (
  <View style={styles.empty}>
    <Text>The popover!!!</Text>
  </View>
);

const POPOVER_MARGIN = 16;
const EMPTY_POPOVER = {
  width: 200,
  height: 100,
  Component: PopoverEmptyContents,
};

const measurePopover = ({
  anchorTop,
  anchorLeft,
  anchorWidth,
  anchorHeight,
  width,
  height,
  keyboardState,
}) => {
  const availScreenHeight = vh * 100 - keyboardState.height;

  // horizontally center the popover above the calling element
  let popoverLeft = anchorLeft + anchorWidth * 0.5 - width * 0.5;
  let popoverTop = anchorTop - height - POPOVER_MARGIN;

  // constrain to screen
  if (popoverLeft < POPOVER_MARGIN) {
    popoverLeft = POPOVER_MARGIN;
  } else if (popoverLeft > vw * 100 - width - POPOVER_MARGIN) {
    popoverLeft = vw * 100 - width - POPOVER_MARGIN;
  }
  if (popoverTop < POPOVER_MARGIN * 2) {
    // if we extend above the top of the screen, reverse orientation
    popoverTop = anchorTop + anchorHeight + POPOVER_MARGIN;
  } else if (popoverTop + height > availScreenHeight) {
    popoverTop = availScreenHeight - height - POPOVER_MARGIN;
  }
  return { left: popoverLeft, top: popoverTop };
};

const Popover = () => {
  const { currentPopover, closePopover } = usePopover();
  let { x, y, width, height, Component, measureRef, visible, opacity, ...props } = currentPopover;

  let [measurements, setMeasurements] = React.useState({});
  const [keyboardState] = useKeyboard();

  React.useEffect(() => {
    if (measureRef) {
      measureRef.measure((x, y, anchorWidth, anchorHeight, anchorLeft, anchorTop) => {
        setMeasurements(
          measurePopover({
            anchorLeft,
            anchorTop,
            anchorWidth,
            anchorHeight,
            width,
            height,
            keyboardState,
          })
        );
      });
    } else if (x !== undefined && y !== undefined) {
      setMeasurements({ left: x, top: y });
    }
  }, [measureRef, x, y, keyboardState]);

  if (!visible || measurements.left === undefined || measurements.top === undefined) {
    return null;
  }

  return (
    <React.Fragment>
      <TouchableWithoutFeedback onPress={closePopover}>
        <View style={styles.boundary} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          styles.popover,
          {
            left: measurements.left,
            top: measurements.top,
            width,
            height,
            opacity,
          },
        ]}>
        <Component closePopover={closePopover} {...props} />
      </Animated.View>
    </React.Fragment>
  );
};

export const PopoverButton = ({ popover, children, style, activeStyle, ...props }) => {
  const { showPopover, currentPopover } = usePopover();
  const container = React.useRef(null);
  const onPress = () => showPopover({ measureRef: container.current, ...popover });
  const isActive =
    currentPopover && currentPopover.visible && currentPopover.measureRef === container.current;
  return (
    <Pressable
      ref={container}
      style={({ pressed }) => (isActive || pressed ? activeStyle : style)}
      onPress={onPress}
      {...props}>
      {children}
    </Pressable>
  );
};

export const PopoverProvider = (props) => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  const [state, setState] = React.useState({
    visible: false,
    opacity: opacity,
    ...EMPTY_POPOVER,
  });

  const showPopover = React.useCallback(
    (props) => {
      if (Platform.OS == 'android') {
        GhostChannels.setIsPopoverOpen(true);
      }

      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      setState({ visible: true, opacity: opacity, ...EMPTY_POPOVER, ...props });
    },
    [setState]
  );

  const closePopover = React.useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (Platform.OS == 'android') {
        GhostChannels.setIsPopoverOpen(false);
      }
      setState({ visible: false, opacity: opacity, ...EMPTY_POPOVER });
    });
  }, []);

  const value = {
    currentPopover: {
      ...state,
    },
    showPopover,
    closePopover,
  };

  return (
    <PopoverContext.Provider value={value}>
      {props.children}
      <Popover />
    </PopoverContext.Provider>
  );
};
