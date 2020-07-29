import { Linking } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import Url from 'url-parse';

import * as Session from './Session';

let rootNavigatorRef = null;

const navigateToRoute = ({ name, params }) => {
  if (rootNavigatorRef) {
    rootNavigatorRef.dispatch(CommonActions.navigate({ name, params }));
  }
};

export const navigateToUri = async (uri) => {
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
      const url = new Url(uri);
      if (url?.pathname) {
        const pathComponents = url.pathname.split('/');
        while (pathComponents.length && pathComponents[0] === '') {
          pathComponents.shift();
        }
        if (pathComponents[0] === 'd') {
          const deckId = pathComponents.length > 1 ? pathComponents[1] : null;
          if (deckId) {
            let deck;
            try {
              deck = await Session.getDeckById(deckId);
            } catch (_) {}
            if (deck) {
              navigateToRoute({
                name: 'PlayDeck',
                params: {
                  decks: [deck],
                  title: 'Shared deck',
                },
              });
            }
          }
        }
      }
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
