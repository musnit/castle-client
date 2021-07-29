import React from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import CoreStateTransform from './CoreStateTransform';

const listenerLists = {}; // `eventName` -> `listenerId` -> `handler`
let nextListenerId = 1;

// maintain a cache of event data
// so that a component can mount later and get the most recent data for its subscription
const CORE_STATE_PREFIX = 'EDITOR_';
let coreStateCache = {};
const setCoreStateCache = (eventName, data) => (coreStateCache[eventName] = data);
export const getCoreStateCache = (eventName) => coreStateCache[eventName];
const clearCoreStateCache = () => (coreStateCache = {});

export async function sendAsync(name, params) {
  const event = { name, params };
  const eventJson = JSON.stringify(event);
  NativeModules.CastleCoreBridge.sendEventAsync(eventJson);
}

const eventEmitter = new NativeEventEmitter(NativeModules.CastleCoreBridge);
eventEmitter.addListener('onReceiveEvent', (eventJson) => {
  let name, eventId, params;
  try {
    const event = JSON.parse(eventJson);
    name = event.name;
    eventId = event.eventId;
    params = event.params;
  } catch (e) {
    console.log(`CoreEvents: parse error: ${eventJson}`);
    return;
  }

  // maybe transform and cache editor events
  let data = params;
  if (name.startsWith(CORE_STATE_PREFIX)) {
    const constName = name.indexOf(':') >= 0 ? name.substring(0, name.indexOf(':')) : name;
    if (CoreStateTransform[constName]) {
      data = CoreStateTransform[constName](name, eventId, params);
    }
    setCoreStateCache(name, data);
  }

  const listenerList = listenerLists[name];
  if (listenerList) {
    Object.values(listenerList).forEach((handler) => handler(data));
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

const CoreEventsContext = React.createContext({});

// maintain `eventsReady` state, and mark this as true only when the engine component mounts
export const Provider = (props) => {
  const [state, setState] = React.useState({
    eventsId: null,
    eventsReady: false,
  });

  const engineDidMount = async (eventsId) => {
    setState({
      eventsId,
      eventsReady: true,
    });
  };

  const engineDidUnmount = (eventsId) => {
    sendAsync('CLEAR_SCENE');
    clearCoreStateCache();
    setState({
      eventsReady: false,
    });
  };

  const value = {
    ...state,
    engineDidMount,
    engineDidUnmount,
  };

  return <CoreEventsContext.Provider value={value}>{props.children}</CoreEventsContext.Provider>;
};

export const useCoreEvents = () => React.useContext(CoreEventsContext);

export const useListen = ({ eventName, handler, onRemove }) => {
  const savedHandler = React.useRef();
  const { eventsReady } = useCoreEvents();

  React.useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  React.useEffect(() => {
    if (eventsReady) {
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
    }
  }, [eventsReady]);
};

export const useCoreState = (eventName) => {
  const [data, setData] = React.useState(getCoreStateCache(eventName));
  useListen({
    eventName,
    handler: (data) => {
      return setData(data);
    },
  });
  React.useEffect(() => {
    // if an event arrived after mounting, but before we finished adding the handler,
    // send a one-off update
    if (getCoreStateCache(eventName) !== data) {
      setData(getCoreStateCache(eventName));
    }
  }, []);
  return data;
};

export const sendGlobalAction = (action, value) =>
  sendAsync('EDITOR_GLOBAL_ACTION', { action, value });

export const sendBehaviorAction = (behavior, action, propertyName, propertyType, value) => {
  let stringValue = '',
    doubleValue = 0;
  if (action === 'set') {
    if (propertyType === 'string') {
      stringValue = value;
    } else if (propertyType == 'b') {
      doubleValue = value ? 1 : 0;
    } else {
      doubleValue = value;
    }
  }
  return sendAsync('EDITOR_MODIFY_COMPONENT', {
    behaviorName: behavior,
    action,
    propertyName,
    propertyType,
    stringValue,
    doubleValue,
  });
};
