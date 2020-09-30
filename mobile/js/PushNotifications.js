import { NativeModules, Platform, DeviceEventEmitter, NativeEventEmitter } from 'react-native';

let gListenerId = 0;
let gInitialData = {};
const gReceivedListeners = {};
const gClickedListeners = {};

const eventEmitter = Platform.select({
  ios: new NativeEventEmitter(NativeModules.GhostPushNotifications),
  android: DeviceEventEmitter,
});

eventEmitter.addListener('CastlePushNotificationReceived', (event) => {
  let dataString = event.dataString;
  let data = JSON.parse(dataString);

  for (const [_, listener] of Object.entries(gReceivedListeners)) {
    listener(data);
  }
});

eventEmitter.addListener('CastlePushNotificationClicked', (event) => {
  let dataString = event.dataString;
  let data = JSON.parse(dataString);

  for (const [_, listener] of Object.entries(gClickedListeners)) {
    listener(data);
  }
});

export const setInitialData = (dataString) => {
  gInitialData = JSON.parse(dataString);
};

export const getInitialData = () => {
  return gInitialData;
};

export const clearInitialData = () => {
  gInitialData = {};
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
