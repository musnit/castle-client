import { NativeModules } from 'react-native';

export async function sendEventAsync(name, params) {
  const event = { name, params };
  const eventJson = JSON.stringify(event);
  NativeModules.CastleCoreBridge.sendEventAsync(eventJson);
}
