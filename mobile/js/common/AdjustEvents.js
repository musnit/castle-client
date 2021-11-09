import { Adjust, AdjustEvent } from 'react-native-adjust';

export const tokens = {
  SIGN_UP: 'a4jmvn',
};

export const trackEvent = (eventToken) => {
  const adjustEvent = new AdjustEvent(eventToken);
  Adjust.trackEvent(adjustEvent);
};
