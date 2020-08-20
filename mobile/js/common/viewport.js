import React from 'react';
import { Dimensions } from 'react-native';

import * as Constants from '../Constants';

const { width, height } = Dimensions.get('window');

const units = {
  vw: width / 100,
  vh: height / 100,
};

units.vmin = Math.min(units.vw, units.vh);
units.vmax = Math.max(units.vw, units.vh);
units.aspectRatio = width / height;
units.isUltraWide = units.aspectRatio < 0.5;

// is the screen tall enough to fit a card full width?
// only if the height is at least (7/5) the width
units.isCardWide = units.aspectRatio <= Constants.CARD_RATIO;

units.gridItemWidth = (width - Constants.GRID_PADDING * 2) / 3;

export default units;
