import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import gql from 'graphql-tag';
import { useLazyQuery } from '@apollo/react-hooks';
import { sendAsync, useGhostEvents, useListen } from './ghost/GhostEvents';

import GameLoading from './GameLoading';
import GameLogs from './GameLogs';
import GhostView from './ghost/GhostView';
import Tools from './Tools';

import * as GhostChannels from './ghost/GhostChannels';
import * as LuaBridge from './LuaBridge';
import * as Session from './Session';

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
const useInitialData = ({ eventsReady, dimensionsSettings, extras }) => {
  const [sent, setSent] = useState(false);
  const sending = useRef(false);

  useEffect(() => {
    let mounted = true;
    if (eventsReady && !sending.current && dimensionsSettings) {
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
          user: {},
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
  }, [eventsReady, dimensionsSettings]);

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
    eventName: 'SCENE_CREATOR_GAME_LOADED',
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
const GameView = ({
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
  paused,
}) => {
  useDeckState({ deckState });

  const dimensionsSettings = computeDimensionsSettings({
    metadata: {
      dimensions: 800,
    },
  });

  const { gameDidMount, gameDidUnmount, eventsReady } = useGhostEvents();

  const initialDataHook = useInitialData({ eventsReady, dimensionsSettings, extras });

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
        // sometimes getting a "missing request token for request" error
        // on ios when trying to read the screenshot.png file
        // without this delay
        setTimeout(() => {
          onScreenshot(params);
        }, 300);
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

  // TODO: entryPoint should actually reflect native entry point
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
          <GhostView style={{ flex: 1 }} dimensionsSettings={dimensionsSettings} paused={paused} />
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

export default GameView;
