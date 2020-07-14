import * as React from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Viewport from '../viewport';
import FastImage from 'react-native-fast-image';

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
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
  },
  empty: {
    padding: 16,
  },
  carat: {
    position: 'absolute',
    width: 25,
    height: 16,
    marginLeft: -12.5,
    marginTop: -4,
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

const Carat = ({ style }) => (
  <View style={[styles.carat, style]}>
    <FastImage
      style={{ width: 25, height: 16 }}
      source={require('../../assets/images/popover-carat.png')}
    />
  </View>
);

const Popover = () => {
  const { currentPopover, closePopover } = usePopover();
  let { x, y, width, height, Component, measureRef, visible, ...props } = currentPopover;
  const opacity = React.useRef(new Animated.Value(0)).current;

  let [position, setPosition] = React.useState({});
  React.useEffect(() => {
    if (measureRef) {
      measureRef.measure((x, y, anchorWidth, anchorHeight, anchorLeft, anchorTop) => {
        // horizontally center the popover above the calling element
        let popoverLeft = anchorLeft + anchorWidth * 0.5 - width * 0.5;
        let popoverTop = anchorTop - height - POPOVER_MARGIN;
        let caratLeft = width * 0.5;
        let caratTop = height;

        // constrain to screen
        // TODO: flip orientation instead of moving
        if (popoverLeft < POPOVER_MARGIN) {
          caratLeft += popoverLeft - POPOVER_MARGIN;
          popoverLeft = POPOVER_MARGIN;
        } else if (popoverLeft > vw * 100 - width - POPOVER_MARGIN) {
          caratLeft += popoverLeft - vw * 100 - width - POPOVER_MARGIN;
          popoverLeft = vw * 100 - width - POPOVER_MARGIN;
        }
        if (popoverTop < POPOVER_MARGIN) {
          popoverTop = POPOVER_MARGIN;
        } else if (popoverTop + height > vh * 100) {
          popoverTop = vh * 100 - height - POPOVER_MARGIN;
        }

        setPosition({
          left: popoverLeft,
          top: popoverTop,
          caratLeft,
          caratTop,
        });
      });
    } else if (x !== undefined && y !== undefined) {
      setPosition({ left: x, top: y, caratLeft: width * 0.5, caratTop: height });
    }
  }, [measureRef, x, y]);

  React.useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible || position.left === undefined || position.top === undefined) {
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
          { left: position.left, top: position.top, width, height, opacity },
        ]}>
        <Component closePopover={closePopover} {...props} />
        <Carat style={{ left: position.caratLeft, top: position.caratTop }} />
      </Animated.View>
    </React.Fragment>
  );
};

export const PopoverButton = ({ popover, children, style, activeStyle, ...props }) => {
  const { showPopover, currentPopover } = usePopover();
  const container = React.useRef(null);
  const onPress = () => showPopover({ measureRef: container.current, ...popover });
  return (
    <TouchableOpacity
      ref={container}
      style={currentPopover?.visible ? activeStyle : style}
      onPress={onPress}
      {...props}>
      {children}
    </TouchableOpacity>
  );
};

export const PopoverProvider = (props) => {
  const [state, setState] = React.useState({
    visible: false,
    ...EMPTY_POPOVER,
  });

  const showPopover = React.useCallback(
    (props) => setState({ visible: true, ...EMPTY_POPOVER, ...props }),
    [setState]
  );
  const closePopover = React.useCallback(() => setState({ visible: false, ...EMPTY_POPOVER }), []);

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
