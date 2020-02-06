import { Platform } from 'react-native';

export const iOS = Platform.OS === 'ios';
export const Android = Platform.OS === 'android';
export const USE_CARDS_PROTOTYPE = true;

export const styles = {
  dropShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 1,
  },
  colors: {
    // ... shared colors go here ...
    // red: '#f00',
  },
};
