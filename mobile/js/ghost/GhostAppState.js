import * as React from 'react';
import { NativeModules, Platform, DeviceEventEmitter, NativeEventEmitter } from 'react-native';

const eventEmitter = Platform.select({
  ios: new NativeEventEmitter(NativeModules.GhostAppState),
  android: DeviceEventEmitter,
});

export const useAppState = (handler) =>
  React.useEffect(() => {
    const listener = eventEmitter.addListener('onAppStateChange', handler);
    return () => listener.remove();
  });
