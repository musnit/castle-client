import { Platform } from 'react-native';

export const iOS = Platform.OS === 'ios';
export const Android = Platform.OS === 'android';

export const CARD_RATIO = 5 / 7;

export const styles = {
  dropShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  textShadow: {
    textShadowColor: '#0004',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    backgroundColor: '#fff',
  },
  primaryButtonLabel: {
    color: '#000',
    fontSize: 16,
  },
  paneHandle: {
    width: 50,
    alignSelf: 'center',
    paddingTop: 4,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
};

export const colors = {
  // ... shared colors go here ...
  // red: '#f00',
};

export const EMPTY_CARD = {
  title: '',
  blocks: [],
  scene: {
    sceneId: Math.floor(Math.random() * 100000),
    data: { empty: true },
  },
};
