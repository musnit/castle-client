import React, { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useLazyQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useActionSheet } from '@expo/react-native-action-sheet';

import GhostView from './ghost/GhostView';
import { sendAsync, useGhostEvents, useListen } from './ghost/GhostEvents';
import * as MainSwitcher from './MainSwitcher';
import * as LuaBridge from './LuaBridge';
import * as Session from './Session';
import * as GhostChannels from './ghost/GhostChannels';
import Tools from './Tools';
import GameLoading from './GameLoading';
import GameLogs from './GameLogs';

// Read dimensions settings into the `{ width, height, upscaling, downscaling }` format for `GhostView`
const computeDimensionsSettings = ({ metadata }) => {
  const { dimensions, scaling, upscaling, downscaling } = metadata;

  let dimensionsSettings = {
    width: 800,
    height: 450,
    upscaling: 'on',
    downscaling: 'on',
  };
  if (dimensions) {
    if (dimensions === 'full') {
      dimensionsSettings.width = 0;
      dimensionsSettings.height = 0;
    } else {
      if (typeof dimensions === 'string') {
        const xIndex = dimensions.indexOf('x');
        if (xIndex > 1) {
          // WxH
          const [widthStr, heightStr] = dimensions.split('x');
          dimensionsSettings.width = parseInt(widthStr) || 800;
          dimensionsSettings.height = parseInt(heightStr) || 450;
        } else if (xIndex == 0) {
          // xH
          dimensionsSettings.width = 0;
          dimensionsSettings.height = parseInt(dimensions.slice(1));
        } else if (xIndex == -1) {
          // W
          dimensionsSettings.width = parseInt(dimensions);
          dimensionsSettings.height = 0;
        }
      } else if (typeof dimensions === 'number') {
        dimensionsSettings.width = dimensions;
        dimensionsSettings.height = 0;
      }
    }
  }
  if (scaling) {
    dimensionsSettings.upscaling = scaling;
    dimensionsSettings.downscaling = scaling;
  }
  if (upscaling) {
    dimensionsSettings.upscaling = upscaling;
  }
  if (downscaling) {
    dimensionsSettings.downscaling = downscaling;
  }

  // Mobile overrides...
  dimensionsSettings.upscaling = 'on';
  dimensionsSettings.downscaling = 'on';

  return dimensionsSettings;
};

// Populate the 'INITIAL_DATA' channel that Lua reads for various initial settings (eg. the user
// object, initial audio volume, initial post, ...)
const useInitialData = ({ dimensionsSettings, extras }) => {
  const [sent, setSent] = useState(false);
  const sending = useRef(false);

  // Fetch `me`
  const isLoggedIn = Session.isSignedIn();
  const [callMe, { loading: meLoading, called: meCalled, data: meData }] = useLazyQuery(gql`
    query Me {
      me {
        ...LuaUser
      }
    }
    ${LuaBridge.LUA_USER_FRAGMENT}
  `);
  if (isLoggedIn && !meCalled) {
    callMe();
  }
  const me = isLoggedIn && !meLoading && meData && meData.me;

  useEffect(() => {
    let mounted = true;
    if (!sending.current && dimensionsSettings && (!isLoggedIn || me)) {
      // Ready to send to Lua
      sending.current = true;
      (async () => {
        if (!mounted) {
          return;
        }

        // Clear the channel just in case
        if (!mounted) {
          return;
        }

        // Prepare the data
        const initialData = {
          graphics: {
            width: dimensionsSettings.width,
            height: dimensionsSettings.height,
          },
          audio: { volume: 1 },
          user: {
            isLoggedIn,
            me: await LuaBridge.jsUserToLuaUser(me),
          },
          initialParams: extras.initialParams ? extras.initialParams : undefined,
          // TODO(nikki): Add `initialPost`...
        };

        if (!mounted) {
          return;
        }

        // Send it!
        await sendAsync('BASE_RELOAD', initialData);
        if (!mounted) {
          return;
        }
        setSent(true);
      })();
    }
    return () => (mounted = false);
  }, [dimensionsSettings, isLoggedIn, me]);

  return { sent };
};

// Keep track of Lua loading state
const useLuaLoading = ({ onLoaded }) => {
  // Maintain list of network requests Lua is making
  const [networkRequests, setNetworkRequests] = useState([]);
  useListen({
    eventName: 'GHOST_NETWORK_REQUEST',
    handler: async ({ type, id, url, method }) => {
      if (type === 'start') {
        // Add to `networkRequests` if `url` is new
        setNetworkRequests((networkRequests) =>
          !networkRequests.find((req) => req.url == url)
            ? [...networkRequests, { id, url, method }]
            : networkRequests
        );
      }
      if (type === 'stop') {
        // Wait for a slight bit then remove from `networkRequests`
        await new Promise((resolve) => setTimeout(resolve, 60));
        setNetworkRequests((networkRequests) => networkRequests.filter((req) => req.id !== id));
      }
    },
  });

  // Maintain whether Lua finished loading (`love.load` is done)
  const [loaded, setLoaded] = useState(false);
  useListen({
    eventName: 'CASTLE_GAME_LOADED',
    handler: () => {
      if (onLoaded) {
        onLoaded();
      }
      setLoaded(true);
    },
  });

  return { networkRequests, loaded };
};

const useDeckState = ({ deckState }) => {
  useEffect(() => {
    sendAsync('UPDATE_DECK_STATE', {
      deckState,
    });
  }, [deckState]);
};

// Given a `gameId` or `gameUri`, run and display the game! The lifetime of this component must match the
// lifetime of the game run -- it must be unmounted when the game is stopped and a new instance mounted
// if a new game should be run (or even if the same game should be restarted).
export const GameView = ({
  extras,
  windowed,
  onPressReload,
  logsVisible,
  setLogsVisible,
  toolsVisible,
  onPressBack,
  onScreenshot,
  onMessage,
  onLoaded,
  deckState,
}) => {
  useDeckState({ deckState });

  const dimensionsSettings = computeDimensionsSettings({
    metadata: {
      dimensions: 800,
    },
  });

  const initialDataHook = useInitialData({ dimensionsSettings, extras });

  const { gameDidMount, gameDidUnmount, eventsReady } = useGhostEvents();

  useEffect(() => {
    const id = Math.floor(Math.random() * Math.floor(1000));
    gameDidMount(id);
    return () => gameDidUnmount(id);
  }, []);

  const luaLoadingHook = useLuaLoading({ onLoaded });

  // TODO: do we actually need to pass in anything for game?
  LuaBridge.useLuaBridge({ game: {} });

  useListen({
    eventName: 'GHOST_SCREENSHOT',
    handler: (params) => {
      if (onScreenshot) {
        onScreenshot(params);
      }
    },
  });

  useListen({
    eventName: 'GHOST_MESSAGE',
    handler: (params) => {
      if (onMessage) {
        onMessage(params);
      }
    },
  });

  useListen({
    eventName: 'GHOST_BACK',
    handler: (params) => {
      if (onPressBack) {
        onPressBack();
      }
    },
  });

  const [landscape, setLandscape] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{ flex: 1 }}
        onLayout={({
          nativeEvent: {
            layout: { width, height },
          },
        }) => setLandscape(width > height)}>
        {eventsReady && initialDataHook.sent ? (
          <Tools visible={toolsVisible !== false && !windowed} landscape={landscape}>
            <GhostView style={{ flex: 1 }} dimensionsSettings={dimensionsSettings} />
          </Tools>
        ) : null}
        {!luaLoadingHook.loaded ? (
          <GameLoading
            noGame={false}
            fetching={false}
            luaNetworkRequests={luaLoadingHook.networkRequests}
            extras={extras}
          />
        ) : null}
        <GameLogs visible={!windowed && logsVisible} />
      </View>
    </View>
  );
};

// Navigate to a game given its `gameId` or `gameUri`. `focus` is whether to shift focus to the game view.
//
// `extras` carries extra parameters to the game:
//   `referrerGame`: Game that navigated to this game through `castle.game.load`, if any
//   `initialParams`: `params` parameter passed to `castle.game.load` while navigating to this game, if any
//   `sessionId`: Session ID for the multiplayer session, if any
//
// This function is actually set below when `GameScreen` is mounted.
export let goToGame = ({ gameId, gameUri, focus, extras }) => {};

// Top-level component which stores the `gameId` or  `gameUri` state. This component is mounted for the
// entire lifetime of the app and mounts fresh `GameView` instances for each game run.
const GameScreen = ({ windowed = false }) => {
  // Keep a single state object to make sure that re-renders happen in sync for all values
  const [state, setState] = useState({
    gameId: null,
    gameUri: null,
    reloadCount: 0,
    extras: {},
  });

  goToGame = async ({ gameId: newGameId, gameUri: newGameUri, focus = true, extras = {} }) => {
    // Use a bit of a delay so we don't set state within `GameView` handlers
    await new Promise((resolve) => setTimeout(resolve, 40));

    if (newGameId || newGameUri) {
      MainSwitcher.setGameRunning(true);
      if (focus) {
        MainSwitcher.switchTo('game');
      }
    } else {
      MainSwitcher.switchTo('navigator');
      MainSwitcher.setGameRunning(false);
    }

    setState({
      ...state,
      gameId: newGameId ? newGameId : null,
      gameUri: newGameId ? null : newGameUri,
      extras,
    });
  };

  const onPressReload = async () => {
    // Use a bit of a delay so we don't set state within `GameView` handlers
    await new Promise((resolve) => setTimeout(resolve, 40));

    setState({
      ...state,
      reloadCount: state.reloadCount + 1,
    });
  };

  const [logsVisible, setLogsVisible] = useState(false);

  // Use `key` to mount a new instance of `GameView` when the game changes
  const { gameId, gameUri, reloadCount, extras } = state;
  return gameId || gameUri ? (
    <GameView
      key={`$${reloadCount}-${gameId || gameUri}`}
      gameId={gameId}
      gameUri={gameUri}
      extras={extras}
      windowed={windowed}
      onPressReload={onPressReload}
      logsVisible={logsVisible}
      setLogsVisible={setLogsVisible}
    />
  ) : null;
};

export default GameScreen;
