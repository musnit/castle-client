import React from 'react';

import * as Constants from '../../../Constants';
const { CastleIcon } = Constants;

const getIconName = (instrument) => {
  if (!instrument?.type) {
    return 'tone';
  }
  switch (instrument.type) {
    case 'sampler':
      switch (instrument.sample.type) {
        case 'sfxr':
          return 'sfxr';
        case 'microphone':
          return 'recording';
        case 'library':
          return 'file';
        case 'tone':
          return 'tone';
      }
    case 'drums':
      return 'drum';
  }
  return 'tone';
};

export const InstrumentIcon = ({ instrument, ...props }) => (
  <CastleIcon name={`instrument-${getIconName(instrument)}`} {...props} />
);
