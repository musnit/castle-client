import React from 'react';
import { BackHandler, Platform } from 'react-native';
import { useListen } from '../ghost/GhostEvents';
import { useFocusEffect } from '../ReactNavigation';

export const useGameViewAndroidBackHandler = Platform.select({
  ios: () => null,
  android: ({ onHardwareBackPress }) => {
    // with no game loaded, use standard back handler
    useFocusEffect(
      React.useCallback(() => {
        BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);

        return () => BackHandler.removeEventListener('hardwareBackPress', onHardwareBackPress);
      }, [onHardwareBackPress])
    );

    // after the game loads, it listens for keyboard events and
    // causes react native's back button event to fail
    // TODO: Wire up to new engine
    return useListen({
      eventName: 'CASTLE_SYSTEM_BACK_BUTTON',
      handler: onHardwareBackPress,
    });
  },
});
