import React from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';

const listenerLists = {}; // `eventName` -> `listenerId` -> `handler`
let nextListenerId = 1;

export async function sendAsync(name, params) {
  const event = { name, params };
  const eventJson = JSON.stringify(event);
  NativeModules.CastleCoreBridge.sendEventAsync(eventJson);
}

const eventEmitter = new NativeEventEmitter(NativeModules.CastleCoreBridge);
eventEmitter.addListener('onReceiveEvent', (eventJson) => {
  console.log(`received event from core: ${eventJson}`);
  const { name, params } = JSON.parse(eventJson);

  const listenerList = listenerLists[name];
  if (listenerList) {
    Object.values(listenerList).forEach((handler) => handler(params));
  }
});

export const listen = (name, handler) => {
  let listenerList = listenerLists[name];
  if (!listenerList) {
    listenerList = {};
    listenerLists[name] = listenerList;
  }

  const listenerId = nextListenerId++;
  listenerList[listenerId] = handler;

  return {
    remove() {
      delete listenerList[listenerId];
    },
  };
};

export const useListen = ({ eventName, handler, onRemove }) => {
  const savedHandler = React.useRef();

  React.useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  React.useEffect(() => {
    let mounted = true;
    const handle = listen(eventName, (params) => {
      if (mounted) {
        savedHandler.current(params);
      }
    });
    return () => {
      mounted = false;
      if (onRemove) {
        onRemove();
      }
      handle.remove();
    };
  }, []);
};
