import React from 'react';
import { Transition } from 'react-native-reanimated';

const CardTransition = (
  <Transition.Together>
    <Transition.Out type="fade" durationMs={300} />
    <Transition.Together>
      <Transition.In type="scale" durationMs={300} interpolation="easeOut" />
      <Transition.In type="fade" durationMs={150} delayMs={150} />
    </Transition.Together>
  </Transition.Together>
);

export default CardTransition;
