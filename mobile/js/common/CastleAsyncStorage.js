import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as GhostChannels from '../ghost/GhostChannels';

/**
  we should use this anywhere we might need to access the data from native later.
  otherwise normal AsyncStorage is fine.
*/
export const CastleAsyncStorage =
  Platform.OS === 'ios'
    ? AsyncStorage
    : {
        getItem: GhostChannels.getCastleAsyncStorage,
        setItem: GhostChannels.setCastleAsyncStorage,
        removeItem: GhostChannels.removeCastleAsyncStorage,
      };
