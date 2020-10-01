import { NativeModules, Platform, DeviceEventEmitter, NativeEventEmitter } from 'react-native';

let gListenerId = 0;
let gInitialData = null;
const gReceivedListeners = {};
const gClickedListeners = {};

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
  let data = _parsePushDataString(dataString);

  for (const [_, listener] of Object.entries(gClickedListeners)) {
    listener(data);
  }
});

export const setInitialData = (dataString) => {
  gInitialData = _parsePushDataString(dataString);
};

export const getInitialData = () => {
  return gInitialData;
};

export const clearInitialData = () => {
  gInitialData = null;
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

const _parsePushDataString = (dataString) => {
  let data;
  try {
    data = JSON.parse(dataString);
  } catch (e) {
    console.warn(`Couldn't parse push notification data: ${e}\n(raw data was: ${dataString})`);
  }
  return data;
};
