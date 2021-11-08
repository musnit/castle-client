import React, { useState, useRef, useEffect } from 'react';
import { GameView } from '../game/GameView';

export const NativeDecksFeed = () => {
  return <GameView
    initialParams={JSON.stringify({
      useNativeFeed: true,
    })}
    paused={false}
  />
};
