import React, { useEffect, useState } from 'react';
import {
  useNavigation as realUseNavigation,
  useIsFocused as realUseIsFocused,
  useFocusEffect as realUseFocusEffect,
  useScrollToTop as realUseScrollToTop,
} from '@react-navigation/native';
import { Platform, DeviceEventEmitter } from 'react-native';
import * as GhostChannels from './ghost/GhostChannels';
import Viewport from './common/viewport';

export const ANDROID_USE_NATIVE_NAVIGATION = false;

export const AndroidNavigationContext = React.createContext(
  ANDROID_USE_NATIVE_NAVIGATION
    ? {}
    : {
        navigatorWindowHeight: Viewport.vh * 100,
      }
);

export const useNavigation = (...args) => {
  if (Platform.OS === 'ios' || !ANDROID_USE_NATIVE_NAVIGATION) {
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

      getState: () => {
        return {
          index: navigatorStackDepth ? navigatorStackDepth : 0,
        };
      },

      navigatorId,
    };
  }
};

export const useIsFocused = () => {
  if (Platform.OS === 'ios' || !ANDROID_USE_NATIVE_NAVIGATION) {
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
  if (Platform.OS === 'ios' || !ANDROID_USE_NATIVE_NAVIGATION) {
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
    }, [args[0]]);
  }
};

export const useScrollToTop = (...args) => {
  if (Platform.OS === 'ios' || !ANDROID_USE_NATIVE_NAVIGATION) {
    return realUseScrollToTop(...args);
  } else {
  }
};

export const withNavigation = (Component) => {
  if (Platform.OS === 'ios' || !ANDROID_USE_NATIVE_NAVIGATION) {
    // navigation prop is already added to Screens on iOS
    return Component;
  } else {
    const WrappedComponent = ({ onRef, ...rest }) => {
      const navigation = useNavigation();
      return <Component ref={onRef} navigation={navigation} {...rest} />;
    };

    return WrappedComponent;
  }
};
