import * as React from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

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
});

const PopoverContext = React.createContext({});
export const usePopover = () => React.useContext(PopoverContext);

const PopoverEmptyContents = () => (
  <View style={styles.empty}>
    <Text>The popover!!!</Text>
  </View>
);

const Popover = () => {
  const { currentPopover, closePopover } = usePopover();
  const { x, y, visible, ...props } = currentPopover;
  const Component = currentPopover.Component ?? PopoverEmptyContents;

  if (!visible) {
    return null;
  }
  return (
    <React.Fragment>
      <TouchableWithoutFeedback onPress={closePopover}>
        <View style={styles.boundary} />
      </TouchableWithoutFeedback>
      <View style={[styles.popover, { left: x, top: y }]}>
        <Component {...props} />
      </View>
    </React.Fragment>
  );
};

const EMPTY_POPOVER = {
  x: 0,
  y: 0,
  Component: PopoverEmptyContents,
};

export const PopoverProvider = (props) => {
  const [state, setState] = React.useState({
    visible: false,
    ...EMPTY_POPOVER,
  });

  // TODO: callback
  // TODO: measure x, y from calling element
  const showPopover = ({ ...props }) => setState({ visible: true, ...props });
  const closePopover = () => setState({ visible: false, ...EMPTY_POPOVER });

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
