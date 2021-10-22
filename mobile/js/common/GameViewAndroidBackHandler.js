import React from 'react';
import { BackHandler, Platform } from 'react-native';
import { useListen } from '../core/CoreEvents';
import { useFocusEffect } from '../ReactNavigation';

let listenerList = [];

function runHardwareBackPressEvent() {
  for (let i = listenerList.length - 1; i >= 0; i--) {
    let listener = listenerList[i];
    if (listener()) {
      break;
    }
  }
}

export const listen = Platform.select({
  ios: () => null,
  android: () => {
    React.useEffect(() => {
      BackHandler.addEventListener('hardwareBackPress', runHardwareBackPressEvent);

      return () => {
        BackHandler.removeEventListener('hardwareBackPress', runHardwareBackPressEvent);
      }
    });

    useListen({
      eventName: 'CASTLE_SYSTEM_BACK_BUTTON',
      handler: runHardwareBackPressEvent,
    });
  }
});

export const useGameViewAndroidBackHandler = Platform.select({
  ios: () => null,
  android: ({ onHardwareBackPress }) => {
    // with no game loaded, use standard back handler
    useFocusEffect(
      React.useCallback(() => {
        listenerList.push(onHardwareBackPress);

        return () => {
          listenerList = listenerList.filter(item => item !== onHardwareBackPress)
        }
      }, [onHardwareBackPress])
    );
  },
});
