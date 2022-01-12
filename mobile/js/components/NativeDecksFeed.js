import React, { useState, useRef, useEffect } from 'react';
import { GameView } from '../game/GameView';
import * as Constants from '../Constants';

export const NativeDecksFeed = () => {
  return (
    <GameView
      initialParams={JSON.stringify({
        useNativeFeed: true,
        textOverlayStyle: Constants.CORE_OVERLAY_TEXT_STYLE,
      })}
      paused={false}
    />
  );
};
