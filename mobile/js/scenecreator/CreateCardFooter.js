import * as React from 'react';
import { CreateCardBottomActions, CARD_BOTTOM_MIN_HEIGHT } from './CreateCardBottomActions';
import { CreateCardCaptureActions } from './CreateCardCaptureActions';

export const getFooterHeight = ({ isShowingDraw }) => {
  return 0; // We no longer have a footer...
  //return isShowingDraw ? 0 : CARD_BOTTOM_MIN_HEIGHT;
};

export const CreateCardFooter = ({ isShowingDraw, isPlayingScene, isSceneLoaded, ...props }) => {
  if (!isSceneLoaded) return null;
  return isShowingDraw ? null : isPlayingScene ? (
    <CreateCardCaptureActions />
  ) : (
    <CreateCardBottomActions {...props} />
  );
};
