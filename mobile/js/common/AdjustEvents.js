import { NativeModules } from 'react-native';
import { Adjust, AdjustEvent } from 'react-native-adjust';

export const tokens = {
  SIGN_UP: 'a4jmvn',
};

export const trackEvent = (eventToken) => {
  NativeModules.CastleAdjust.trackEvent(eventToken);
};

export const addSessionCallbackParameter = (paramName, value) => {
  NativeModules.CastleAdjust.addSessionCallbackParameter(paramName, value);
};

export const removeSessionCallbackParameter = (paramName) => {
  NativeModules.CastleAdjust.removeSessionCallbackParameter(paramName);
};

export const setUserId = (userId) => addSessionCallbackParameter('userId', userId);
export const clearUserId = () => removeSessionCallbackParameter('userId');
