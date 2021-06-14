import { NativeEventEmitter, NativeModules } from 'react-native';

export async function sendEventAsync(name, params) {
  const event = { name, params };
  const eventJson = JSON.stringify(event);
  NativeModules.CastleCoreBridge.sendEventAsync(eventJson);
}

const eventEmitter = new NativeEventEmitter(NativeModules.CastleCoreBridge);
eventEmitter.addListener('onReceiveEvent', (eventJson) => {
  console.log(`received event from core: ${eventJson}`);
  // TODO: Allow registering handlers from other modules, then dispatch to
  //       handler based on `.name` and pass `.params`
});
