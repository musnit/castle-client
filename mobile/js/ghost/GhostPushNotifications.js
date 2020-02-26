import { NativeModules, NativeEventEmitter } from 'react-native';

export const getTokenAsync = () => {
  return NativeModules.GhostPushNotifications.getToken();
};

export const addTokenListener = (listener) => {
  const eventEmitter = new NativeEventEmitter(NativeModules.GhostPushNotifications);
  eventEmitter.addListener('onNewPushNotificationToken', (event) => {
    listener(event.token);
  });
};
