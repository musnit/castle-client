import React from 'react';
import { BackHandler, Platform } from 'react-native';
import { useListen } from '../core/CoreEvents';
import { useFocusEffect, useNavigation } from '../ReactNavigation';

let gGoBack = null;
let gCanGoBack = null;

let listenerList = [() => {
  if (gGoBack && gCanGoBack) {
    if (gCanGoBack()) {
      gGoBack();
    } else {
      BackHandler.exitApp();
    }

    return true;
  }

  return false;
}];

function runHardwareBackPressEvent() {
  for (let i = listenerList.length - 1; i >= 0; i--) {
    let listener = listenerList[i];
    if (listener()) {
      return true;
    }
  }

  return false;
}

export const backHandlerAddEventListener = (eventName, handler) => {
  if (listenerList.indexOf(handler) === -1) {
    listenerList.push(handler);
  }
};

export const backHandlerRemoveEventListener = (eventName, handler) => {
  if (listenerList.indexOf(handler) !== -1) {
    listenerList.splice(
      listenerList.indexOf(handler),
      1,
    );
  }
};

export const listen = Platform.select({
  ios: () => null,
  android: () => {
    useListen({
      eventName: 'CASTLE_SYSTEM_BACK_BUTTON',
      handler: runHardwareBackPressEvent,
    });
  },
});

export const useGameViewAndroidBackHandler = Platform.select({
  ios: () => null,
  android: ({ onHardwareBackPress }) => {
    let { goBack, canGoBack } = useNavigation();

    // with no game loaded, use standard back handler
    useFocusEffect(
      React.useCallback(() => {
        gGoBack = goBack;
        gCanGoBack = canGoBack;

        BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);

        return () => {
          BackHandler.removeEventListener('hardwareBackPress', onHardwareBackPress);
        };
      }, [onHardwareBackPress])
    );
  },
});
