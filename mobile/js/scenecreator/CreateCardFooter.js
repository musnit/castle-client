import * as React from 'react';
import { CreateCardBottomActions, CARD_BOTTOM_MIN_HEIGHT } from './CreateCardBottomActions';
import {
  DrawingCardBottomActions,
  DRAWING_CARD_FOOTER_HEIGHT,
} from './drawing/DrawingCardBottomActions';

export const getFooterHeight = ({ isShowingDraw }) => {
  return isShowingDraw ? DRAWING_CARD_FOOTER_HEIGHT : CARD_BOTTOM_MIN_HEIGHT;
};

export const CreateCardFooter = ({ isShowingDraw, ...props }) => {
  return isShowingDraw ? <DrawingCardBottomActions /> : <CreateCardBottomActions {...props} />;
};
