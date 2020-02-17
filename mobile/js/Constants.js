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
  plainButton: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  plainButtonLabel: {
    color: '#000',
    fontSize: 16,
  },
  primaryButton: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#000',
  },
  primaryButtonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
};

export const colors = {
  // ... shared colors go here ...
  // red: '#f00',
};
