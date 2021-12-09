import * as React from 'react';
import { Amplitude } from '@amplitude/react-native';
import { NativeModules, Platform, DeviceEventEmitter, NativeEventEmitter } from 'react-native';
import { CastleAsyncStorage } from './common/CastleAsyncStorage';
import { markPushNotificationClicked } from './Session';

let gListenerId = 0;
let gInitialData = null;
let gClickedData = null;
const gReceivedListeners = {};
const gClickedListeners = {};

const PUSH_TOKEN_STORAGE_KEY = 'pushNotificationToken';

const eventEmitter = Platform.select({
  ios: new NativeEventEmitter(NativeModules.GhostPushNotifications),
  android: DeviceEventEmitter,
});

eventEmitter.addListener('CastlePushNotificationReceived', (event) => {
  let dataString = event.dataString;
  let data = _parsePushDataString(dataString);

  for (const [_, listener] of Object.entries(gReceivedListeners)) {
    listener(data);
  }
});

eventEmitter.addListener('CastlePushNotificationClicked', (event) => {
  let dataString = event.dataString;
  setClickedData(dataString);
  let data = _parsePushDataString(dataString);

  if (data?.pushNotificationId) {
    markPushNotificationClicked(data?.pushNotificationId);
  }

  Amplitude.getInstance().logEvent('OPEN_PUSH_NOTIFICATION', {
    type: data?.type, // category of notif, e.g. 'play_deck'
  });
  for (const [_, listener] of Object.entries(gClickedListeners)) {
    listener(data);
  }
});

export const setInitialData = (dataString) => {
  gInitialData = _parsePushDataString(dataString);
  Amplitude.getInstance().logEvent('OPEN_PUSH_NOTIFICATION', {
    type: gInitialData?.type, // category of notif, e.g. 'play_deck'
  });
};

export const getInitialData = () => {
  return gInitialData;
};

export const clearInitialData = () => {
  gInitialData = null;
};

export const setClickedData = (dataString) => {
  gClickedData = _parsePushDataString(dataString);
};

export const getClickedData = () => {
  return gClickedData;
};

export const clearClickedData = () => {
  gClickedData = null;
};

export const addReceivedListener = (listener) => {
  let id = gListenerId++;
  gReceivedListeners[id] = listener;
  return id;
};

export const addClickedListener = (listener) => {
  let id = gListenerId++;
  gClickedListeners[id] = listener;
  return id;
};

export const removeListener = (id) => {
  if (gReceivedListeners[id]) {
    delete gReceivedListeners[id];
  }

  if (gClickedListeners[id]) {
    delete gClickedListeners[id];
  }
};

export const requestTokenAsync = async () => {
  try {
    const status = await NativeModules.GhostPushNotifications.requestToken();

    // don't send an event because this will get silently called by the OS on every app launch
    // and we only care about the most recent status
    Amplitude.getInstance().setUserProperties({
      pushNotificationPermissions: Platform.OS === 'android' ? 'granted' : status, // 'granted' or 'denied'
    });
  } catch (e) {
    console.log(`Error requesting push notifiation token ${e}`);
  }
};

export const clearTokenAsync = async () => {
  // just clear local state so we know to notify the server for any future token
  return CastleAsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
};

export const getPlatformAsync = () => {
  return NativeModules.GhostPushNotifications.getPlatform();
};

export const addTokenListener = (listener) => {
  const eventEmitter = Platform.select({
    ios: new NativeEventEmitter(NativeModules.GhostPushNotifications),
    android: DeviceEventEmitter,
  });

  eventEmitter.addListener('onNewPushNotificationToken', async (event) => {
    const existingToken = await CastleAsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    // It seems like updating the token on the server can fail after logging in,
    // so just call this every time for now.
    // If we bring this back, we should make sure the api call is successful
    // before writing to async storage
    //if (!existingToken || existingToken !== event.token) {
    if (event.token) {
      if (await listener(event.token)) {
        CastleAsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, event.token);
      }
    } else {
      CastleAsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    }
    //}
  });
};

// Set the app badge count on both platforms AND the in-app notifs tab badge on Android
export const setBadgeCount = async (count) => {
  if (Platform.OS === 'ios') {
    return NativeModules.GhostPushNotifications.setBadgeCount(count);
  } else {
    NativeModules.GhostPushNotifications.setNotificationsBadgeCount(count);
  }
};

export const setNewFollowingDecks = async (newFollowingDecks) => {
  if (Platform.OS === 'android') {
    NativeModules.GhostPushNotifications.setNewFollowingDecks(newFollowingDecks);
  }
};

export const usePushNotifications = ({ onClicked, onReceived }) =>
  React.useEffect(() => {
    const clicked = addClickedListener(onClicked);
    const received = addReceivedListener(onReceived);
    return () => {
      removeListener(clicked);
      removeListener(received);
    };
  });

const _parsePushDataString = (dataString) => {
  let data;
  try {
    data = JSON.parse(dataString);
  } catch (e) {
    console.warn(`Couldn't parse push notification data: ${e}\n(raw data was: ${dataString})`);
  }
  return data;
};
