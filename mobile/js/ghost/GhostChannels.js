// JS-facing native module that lets you interact with Love Channels
// (https://love2d.org/wiki/Channel). This is the main way of achieving JS <-> Lua communication.
//
// Each method takes a `name` parameter to select the channel as given to `love.thread.getChannel`
// (https://love2d.org/wiki/love.thread.getChannel).
//
// Implemented by 'GhostChannels.mm'.

import { NativeModules } from 'react-native';

export const freezeScreenAsync = () => {
  return NativeModules.GhostChannels.freezeScreenAsync();
};

// Clears all the messages in the Channel queue.
export const clearAsync = (name) => {
  return NativeModules.GhostChannels.clearAsync(name);
};

// Wait for and retrieve the value of a Channel message. `options.timeout` is optional and
// specifies a maximum amount of time to wait.
export const demandAsync = (name, options = {}) => {
  return NativeModules.GhostChannels.demandAsync(name, options);
};

// Retrieves the number of messages in the Channel queue.
export const getCountAsync = (name) => {
  return NativeModules.GhostChannels.getCountAsync(name);
};

// Gets whether a pushed value has been popped or otherwise removed from the Channel. `id` is as
// returned by `.pushAsync` for that value.
export const hasReadAsync = (name, id) => {
  return NativeModules.GhostChannels.hasReadAsync(name, id);
};

// Receive a message from a thread Channel, but leave it in the queue. `undefined` if there's
// no message in the queue.
export const peekAsync = (name) => {
  return NativeModules.GhostChannels.peekAsync(name);
};

// Retrieve the value of a Channel message and remove it from the queue. `undefined` if there's no
// message in the queue.
export const popAsync = (name) => {
  return NativeModules.GhostChannels.popAsync(name);
};

// Retrieve an array of values popped from a Channel till it is exhausted. May not return adjacently
// pushed messages if the Channel is also being popped from on other threads. May loop infinitely if
// values are being simultaneously being added to the Channel as fast or faster than they are being
// popped.
export const popAllAsync = (name) => {
  return NativeModules.GhostChannels.popAllAsync(name);
};

// Send a message to a Channel. Returns its `id`.
export const pushAsync = (name, value) => {
  return NativeModules.GhostChannels.pushAsync(name, value);
};

// Send a message to a Channel and wait for a thread to accept it. `options.timeout` specifies a
// maximum amount of time to wait. Returns whether the message was accepted within the timeout
// (always `true` if no timeout given).
export const supplyAsync = (name, value, options = {}) => {
  return NativeModules.GhostChannels.supplyAsync(name, value, options);
};

export const globalPause = () => {
  return NativeModules.GhostChannels.globalPause();
};

// Call `handler` when a message arrives at a Channel. `handler` is called with the message as the
// only parameter. Call `.remove()` on the returned value to unsubscribe.
export const on = (name, handler) => {
  const interval = setInterval(async () => {
    (await popAllAsync(name)).forEach(handler);
  });

  return {
    remove() {
      clearInterval(interval);
    },
  };
};

export const navigate = (...args) => {
  return NativeModules.GhostChannels.navigate(...args);
};

export const navigatePush = (...args) => {
  return NativeModules.GhostChannels.navigatePush(...args);
};

export const navigateBack = () => {
  return NativeModules.GhostChannels.navigateBack();
};

export const navigatePopToTop = () => {
  return NativeModules.GhostChannels.navigatePopToTop();
};

export const getCastleAsyncStorage = (key) => {
  return NativeModules.GhostChannels.getCastleAsyncStorage(key);
};

export const setCastleAsyncStorage = (key, value) => {
  return NativeModules.GhostChannels.setCastleAsyncStorage(key, value);
};

export const removeCastleAsyncStorage = (key) => {
  return NativeModules.GhostChannels.removeCastleAsyncStorage(key);
};

export const getSmartLockCredentials = () => {
  return NativeModules.GhostChannels.getSmartLockCredentials();
};

export const saveSmartLockCredentials = (username, password, profilePictureUrl) => {
  return NativeModules.GhostChannels.saveSmartLockCredentials(
    username,
    password,
    profilePictureUrl
  );
};

export const setIsPopoverOpen = (isOpen) => {
  return NativeModules.GhostChannels.setIsPopoverOpen(isOpen);
};

export const markNuxComplete = () => {
  return NativeModules.GhostChannels.markNuxComplete();
};
