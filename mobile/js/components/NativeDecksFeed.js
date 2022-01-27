import React from 'react';
import { GameView } from '../game/GameView';
import * as Constants from '../Constants';
import * as CoreViews from '../CoreViews';

export const NativeDecksFeed = ({ onPressComments, isCommentsOpen }) => {
  CoreViews.useCoreViews({ onPressComments });

  return (
    <GameView
      initialParams={JSON.stringify({
        useNativeFeed: true,
        textOverlayStyle: Constants.CORE_OVERLAY_TEXT_STYLE,
      })}
      coreViews={CoreViews.getCoreViews()}
      paused={isCommentsOpen}
    />
  );
};
