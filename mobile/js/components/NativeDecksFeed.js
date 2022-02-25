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
        //nativeFeedDeckIds: ['Qj_sfZaIs', 'Od2Trh95G', '40pCTkzN2', 'PZS8by31X', 'p70imV9b5', 'rZqvqB_vl', 'BzerSltK9', 'kgETrH4RV', 'FHb49f-0n', 'AuKZO3tff'],
        textOverlayStyle: Constants.CORE_OVERLAY_TEXT_STYLE,
      })}
      coreViews={CoreViews.getCoreViews()}
      paused={isCommentsOpen}
    />
  );
};
