import * as React from 'react';
import * as Actions from '~/common/actions';
import * as Analytics from '~/common/analytics';
import * as Utilities from '~/common/utilities';

import { injectGlobalStyles, injectGlobalScrollOverflowPreventionStyles } from './globalStyles';
import { injectGlobalLoaderStyles, LOADER_TRANSITION_MS } from '~/components/primitives/loader';

import App from './App';
import AppLoadingScreen from '~/screens/AppLoadingScreen';
import CurrentUserCache from '~/common/current-user-cache';
import ReactDOM from 'react-dom';
import Storage from '~/common/storage';

import 'react-tippy/dist/tippy.css';

const storage = new Storage('castle');

const loader = document.createElement('div');
loader.id = 'loader';

document.body.appendChild(loader);

const mountLoader = () => {
  ReactDOM.render(<AppLoadingScreen />, document.getElementById('loader'));
};

const unmountLoader = async () => {
  document.getElementById('loader').classList.add('loader--finished');
  document.getElementById('loader-inner').classList.add('loader-inner--finished');
  await Utilities.delay(LOADER_TRANSITION_MS);
  ReactDOM.unmountComponentAtNode(document.getElementById('loader'));
  document.getElementById('loader').outerHTML = '';
};

const getInitialState = async () => {
  CurrentUserCache.setStorage(storage);

  let currentUser = {};
  const accessToken = await Actions.getAccessTokenAsync();
  if (accessToken) {
    currentUser = CurrentUserCache.get();
  }
  if (!currentUser || !currentUser.user) {
    try {
      const user = await Actions.createAnonymousUser();
      currentUser = { user };
    } catch (e) {
      console.warn(`Error during initial app auth: ${e}`);
    }
    CurrentUserCache.set({
      user: currentUser.user,
      timeLastLoaded: Date.now(),
    });
  }
  if (currentUser && currentUser.user) {
    amplitude.getInstance().setUserId(currentUser.user.userId);
  }

  return {
    currentUser,
    navigation: {
      isShowingSignIn: !currentUser.user,
    },
  };
};

const run = async () => {
  mountLoader(); // do not `await` anything before this line!

  // initialize analytics
  await Analytics.initialize();
  Analytics.trackCastleLaunch();

  let state = await getInitialState();

  // if the user was automatically logged in when starting Castle, track that
  if (state.currentUser && state.currentUser.user) {
    Analytics.trackLogin({ user: state.currentUser.user, isAutoLogin: true });
  }

  ReactDOM.render(<App state={state} storage={storage} />, document.getElementById('root'));
  await unmountLoader();
};

injectGlobalStyles();
injectGlobalScrollOverflowPreventionStyles();
injectGlobalLoaderStyles();
run();
