let gListenerId = 0;
let gListeners = {};
let gIdToEventName = {};

export function addListener(eventName, fn) {
  gListenerId++;

  if (!gListeners[eventName]) {
    gListeners[eventName] = {};
  }

  gListeners[eventName][gListenerId] = fn;
  gIdToEventName[gListenerId] = eventName;

  return gListenerId;
}

export function removeListener(id) {
  let eventName = gIdToEventName[id];
  if (!eventName) {
    return;
  }

  delete gListeners[eventName][id];
  delete gIdToEventName[id];
}

export function sendEvent(eventName, args) {
  let listeners = gListeners[eventName];

  if (!listeners) {
    return;
  }

  for (let listener of Object.values(listeners)) {
    try {
      listener(args);
    } catch (e) {}
  }
}
