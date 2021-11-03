import React, { useState, useRef, useEffect } from 'react';
import { GameView } from '../game/GameView';

export const NativeDecksFeed = ({decks}) => {
  const [initialParams, setInitialParams] = useState('');
  useEffect(() => {
    if (decks) {
      setInitialParams(
        JSON.stringify({
          decks: JSON.stringify({decks: decks.map(deck => JSON.stringify(deck))}),
        })
      );
    }
  }, [decks]);

  return <GameView
    initialParams={initialParams}
    paused={false}
  />
};
