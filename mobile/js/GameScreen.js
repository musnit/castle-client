import React, { useState, useRef } from 'react';

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
