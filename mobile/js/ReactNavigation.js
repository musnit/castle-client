import React, { useEffect, useState } from 'react';
import {
  useNavigation as realUseNavigation,
  useIsFocused as realUseIsFocused,
  useFocusEffect as realUseFocusEffect,
  useScrollToTop as realUseScrollToTop,
} from '@react-navigation/native';
import {
  withNavigation as realWithNavigation,
  withNavigationFocus as realWithNavigationFocus,
} from '@react-navigation/compat';
import { Platform, DeviceEventEmitter } from 'react-native';
import * as GhostChannels from './ghost/GhostChannels';

export const AndroidNavigationContext = React.createContext({});

export const useNavigation = (...args) => {
  if (Platform.OS === 'ios') {
    return realUseNavigation(...args);
  } else {
    const { navigatorId, navigatorStackDepth } = React.useContext(AndroidNavigationContext);

    return {
      navigate: (screenType, navigationScreenOptions, androidOptions) => {
        GhostChannels.navigate(
          navigatorId,
          screenType,
          JSON.stringify({
            ...navigationScreenOptions,
            route: {
              params: navigationScreenOptions,
            },
          }),
          androidOptions || {}
        );
      },

      pop: () => {
        GhostChannels.navigateBack();
      },

      goBack: () => {
        GhostChannels.navigateBack();
      },

      popToTop: () => {
        GhostChannels.navigatePopToTop();
      },

      push: (screenType, navigationScreenOptions, androidOptions) => {
        GhostChannels.navigatePush(
          navigatorId,
          screenType,
          JSON.stringify({
            ...navigationScreenOptions,
            route: {
              params: navigationScreenOptions,
            },
          }),
          androidOptions || {}
        );
      },

      dangerouslyGetState: () => {
        return {
          index: navigatorStackDepth ? navigatorStackDepth : 0,
        };
      },
    };
  }
};

export const useIsFocused = () => {
  if (Platform.OS === 'ios') {
    return realUseIsFocused();
  } else {
    const { viewId } = React.useContext(AndroidNavigationContext);
    const [isFocused, setIsFocused] = useState(true);

    useEffect(() => {
      let subscription1 = DeviceEventEmitter.addListener('CastleOnFocusView', (event) => {
        if (event.viewId == viewId) {
          setIsFocused(true);
        }
      });
      let subscription2 = DeviceEventEmitter.addListener('CastleOnBlurView', (event) => {
        if (event.viewId == viewId) {
          setIsFocused(false);
        }
      });

      return () => {
        subscription1.remove();
        subscription2.remove();
      };
    }, []);

    return isFocused;
  }
};

export const useFocusEffect = (...args) => {
  if (Platform.OS === 'ios') {
    return realUseFocusEffect(...args);
  } else {
    const { viewId } = React.useContext(AndroidNavigationContext);

    let returnFn = null;

    useEffect(() => {
      let subscription1 = DeviceEventEmitter.addListener('CastleOnFocusView', (event) => {
        if (event.viewId == viewId) {
          returnFn = args[0]();
        }
      });
      let subscription2 = DeviceEventEmitter.addListener('CastleOnBlurView', (event) => {
        if (event.viewId == viewId) {
          if (returnFn) {
            returnFn();
            returnFn = null;
          }
        }
      });

      returnFn = args[0]();

      return () => {
        subscription1.remove();
        subscription2.remove();

        if (returnFn) {
          returnFn();
          returnFn = null;
        }
      };
    }, []);
  }
};

export const useScrollToTop = (...args) => {
  if (Platform.OS === 'ios') {
    return realUseScrollToTop(...args);
  } else {
  }
};

export const withNavigation = (Component) => {
  if (Platform.OS === 'ios') {
    return realWithNavigation(Component);
  } else {
    const WrappedComponent = ({ onRef, ...rest }) => {
      const navigation = useNavigation();
      return <Component ref={onRef} navigation={navigation} {...rest} />;
    };

    return WrappedComponent;
  }
};

export const withNavigationFocus = (Component) => {
  if (Platform.OS === 'ios') {
    return realWithNavigationFocus(Component);
  } else {
    const WrappedComponent = ({ onRef, ...rest }) => {
      return <Component ref={onRef} isFocused={true} {...rest} />;
    };

    return WrappedComponent;
  }
};
