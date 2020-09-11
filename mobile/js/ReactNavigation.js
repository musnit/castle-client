import React, { useEffect } from 'react';
import {
  useNavigation as realUseNavigation,
  useFocusEffect as realUseFocusEffect,
  useScrollToTop as realUseScrollToTop,
} from '@react-navigation/native';
import {
  withNavigation as realWithNavigation,
  withNavigationFocus as realWithNavigationFocus,
} from '@react-navigation/compat';
import { Platform } from 'react-native';
import * as GhostChannels from './ghost/GhostChannels';

export const AndroidNavigationContext = React.createContext({});

export const useNavigation = (...args) => {
  if (Platform.OS === 'ios') {
    return realUseNavigation(...args);
  } else {
    const { navigatorId } = React.useContext(AndroidNavigationContext);

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
          index: 0,
        };
      },
    };
  }
};

export const useFocusEffect = (...args) => {
  if (Platform.OS === 'ios') {
    return realUseFocusEffect(...args);
  } else {
    return useEffect(args[0], []);
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
