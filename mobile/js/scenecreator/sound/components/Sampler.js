import React from 'react';
import { SAMPLE_COMPONENTS } from './Sample';

export const Sampler = ({ instrument }) => {
  if (instrument?.sample) {
    const { type, ...params } = instrument.sample;
    const SampleComponent = SAMPLE_COMPONENTS[type];
    if (SampleComponent) {
      // TODO: onChangeParams
      return <SampleComponent params={params} />;
    }
  }
  return null;
};
