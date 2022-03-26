import { Linking } from 'react-native';
import { Amplitude } from '@amplitude/react-native';
import { CommonActions } from '@react-navigation/native';
import Url from 'url-parse';

import * as Session from './Session';

let rootNavigatorRef = null;

const navigateToRoute = ({ name, params }) => {
  if (rootNavigatorRef) {
    // avoid race condition where ref gets set before react-nav finishes initializing
    requestAnimationFrame(() => {
      rootNavigatorRef.dispatch(CommonActions.navigate({ name, params }));
    });
  }
};

const _navigateToDeck = ({ deck, resolvedUrl }) => {
  const url = new Url(resolvedUrl, true);
  const cxshid = url?.query?.cxshid;

  Amplitude.getInstance().logEvent('OPEN_DECK_LINK', {
    deckId: deck.deckId,
    url: resolvedUrl,
    cxshid,
  });

  if (rootNavigatorRef) {
    // avoid race condition where ref gets set before react-nav finishes initializing
    requestAnimationFrame(() => {
      rootNavigatorRef.navigate('BrowseTab', {
        screen: 'HomeScreen',
        params: {
          deepLinkDeckId: deck.deckId,
        },
      })
    });
  }
};

// requires an expanded castle url like castle.xyz/d/abcd
// don't call this externally, better to route through `naviateToUri`
const _resolveFullUri = async (uri) => {
  const url = new Url(uri);
  if (url?.pathname) {
    const pathComponents = url.pathname.split('/');
    while (pathComponents.length && pathComponents[0] === '') {
      pathComponents.shift();
    }
    // deck uri?
    if (pathComponents[0] === 'd') {
      const deckId = pathComponents.length > 1 ? pathComponents[1] : null;
      if (deckId) {
        let deck;
        try {
          deck = await Session.getDeckById(deckId);
        } catch (_) {}
        if (deck) {
          return { deck, resolvedUrl: uri };
        }
      }
    }
  }
  return { resolvedUrl: uri };
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
    let resolved;
    let handled = false;
    try {
      resolved = await Session.resolveDeepLink(uri);
      if (!resolved) {
        // this didn't resolve from any short url, try parsing full url
        resolved = await _resolveFullUri(uri);
      }
    } catch (e) {
      console.warn(`Error resolving deep link: ${e}`);
    }
    if (resolved?.deck) {
      handled = true;
      _navigateToDeck(resolved);
    }
    if (!handled) {
      console.warn(`Unable to handle deep link '${uri}'`);
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
