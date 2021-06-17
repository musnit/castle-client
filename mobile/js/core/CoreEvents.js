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
  const [data, setData] = React.useState();
  useListen({
    eventName,
    handler: (data) => setData(data),
  });
  return data;
};

export const sendGlobalAction = (action) => sendAsync('EDITOR_GLOBAL_ACTION', { action });
