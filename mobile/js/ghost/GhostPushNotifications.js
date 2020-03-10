import { NativeModules, Platform, NativeEventEmitter, DeviceEventEmitter } from 'react-native';

export const requestTokenAsync = async () => {
  try {
    return await NativeModules.GhostPushNotifications.requestToken();
  } catch (e) {
    console.log(`Error requesting push notifiation token ${e}`);
  }
};

export const getPlatformAsync = () => {
  return NativeModules.GhostPushNotifications.getPlatform();
};

export const addTokenListener = (listener) => {
  const eventEmitter = Platform.select({
    ios: new NativeEventEmitter(NativeModules.GhostPushNotifications),
    android: DeviceEventEmitter,
  });

  eventEmitter.addListener('onNewPushNotificationToken', (event) => {
    listener(event.token);
  });
};
