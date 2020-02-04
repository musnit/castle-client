import React from 'react';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const units = {
  vw: width / 100,
  vh: height / 100,
};

units.vmin = Math.min(units.vw, units.vh);
units.vmax = Math.max(units.vw, units.vh);
units.aspectRatio = width / height;
units.isUltraWide = units.aspectRatio < 0.5;

export default units;
