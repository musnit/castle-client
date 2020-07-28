import { Linking } from 'react-native';
import { CommonActions } from '@react-navigation/native';

import * as Session from './Session';

let rootNavigatorRef = null;

const navigateToRoute = ({ name, params }) => {
  if (rootNavigatorRef) {
    rootNavigatorRef.dispatch(CommonActions.navigate({ name, params }));
  }
};

export const navigateToUri = (uri) => {
  if (!Session.isSignedIn()) {
    // If not signed in, go to the login screen and tell it to navigate to this URI after
    navigateToRoute({
      name: 'LoginScreen',
      params: {
        uriAfter: uri,
      },
    });
  } else {
    // Game URI?
    {
      const [gameUri, sessionId] = uri.split('#');
      // TODO: go to castle game given by this uri
    }
  }
};

// If we get a URI but the root navigator isn't mounted yet, remember the URI and navigate later

let pendingUri = null;

const consumePendingUri = () => {
  if (pendingUri && rootNavigatorRef) {
    let uri = pendingUri;
    pendingUri = null;
    navigateToUri(uri);
  }
};

export const addPendingUri = (uri) => {
  pendingUri = uri;
  consumePendingUri();
};

export const setNavigationRef = (ref) => {
  rootNavigatorRef = ref;
  consumePendingUri();
};

// Listen for `Linking` events and initial URI

Linking.addEventListener('url', ({ url }) => addPendingUri(url));

(async () => {
  const initialUri = await Linking.getInitialURL();
  if (initialUri) {
    addPendingUri(initialUri);
  }
})();

// Game to start with while developing

let DEV_URI = null;

// DEV_URI = 'http://192.168.1.15:8080/mobile.lua';

if (__DEV__ && DEV_URI) {
  addPendingUri(DEV_URI);
}

// For directly loading card creation screen
/* let isEditingScene = true;
setTimeout(
  () => {
    if (rootNavigatorRef) {
      rootNavigatorRef.dispatch(
        CommonActions.navigate(
          'Create',
          {
            screen: 'CreateDeck',
            params: { deckIdToEdit: 1, cardIdToEdit: 137, isEditingScene },
          }
        )
      );
    }
  },
  500
); */
