import React, { useState, useEffect, useRef } from 'react';

import * as GhostChannels from './GhostChannels';

const listenerLists = {}; // `eventName` -> `listenerId` -> `handler`

let nextListenerId = 1;

const checkEvents = async () => {
  (await GhostChannels.popAllAsync('LUA_TO_JS_EVENTS')).forEach((eventJson) => {
    const { name, params } = JSON.parse(eventJson);

    const listenerList = listenerLists[name];
    if (listenerList) {
      Object.values(listenerList).forEach((handler) => handler(params));
    }
  });
  requestAnimationFrame(checkEvents);
};
requestAnimationFrame(checkEvents);

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

export const sendAsync = async (name, params) => {
  await GhostChannels.pushAsync('JS_EVENTS', JSON.stringify({ name, params }));
};

// Clear Lua <-> JS events channels for a new game
export const clearAsync = async () => {
  await GhostChannels.clearAsync('JS_EVENTS');
  await GhostChannels.clearAsync('LUA_JS_EVENTS');
};

const GhostEventsContext = React.createContext({});

export const Provider = (props) => {
  const [state, setState] = useState({
    eventsId: null,
    eventsReady: false,
  });

  const gameDidMount = async (eventsId) => {
    setState({
      eventsId,
      eventsReady: true,
    });
  };

  const gameDidUnmount = (eventsId) => {
    sendAsync('CLEAR_SCENE');
    setState({
      eventsReady: false,
    });
  };

  const value = {
    ...state,
    gameDidMount,
    gameDidUnmount,
  };

  return <GhostEventsContext.Provider value={value}>{props.children}</GhostEventsContext.Provider>;
};

export const useGhostEvents = () => React.useContext(GhostEventsContext);

export const useListen = ({ eventName, handler }) => {
  const savedHandler = useRef();
  const { eventsReady } = useGhostEvents();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (eventsReady) {
      let mounted = true;
      const handle = listen(eventName, (params) => {
        if (mounted) {
          savedHandler.current(params);
        }
      });
      return () => {
        mounted = false;
        handle.remove();
      };
    }
  }, [eventsReady]);
};
