import React from 'react';
import { GameView } from '../game/GameView';
import { useListen } from '../core/CoreEvents';
import * as Constants from '../Constants';

let coreViews = {
  CONSTANTS: {
    /*
     * 0 - cubicEaseIn
     * 1 - cubicEaseInOut
     * 2 - quadEaseOut
     * 3 - cubicEaseOut
     * 4 - quartEaseOut
     * 5 - quintEaseOut
     * 6 - sinEaseOut
     * 7 - expoEaseOut
     * 8 - circEaseOut
     */
    ANIMATION_EASING_FUNCTION: 4,

    // The time it takes to move to the next card after touch is released
    SCROLL_ANIMATION_TIME: 0.3,

    // How much you have to drag before the card starts moving
    DRAG_START_OFFSET: 50,

    // The card moves by the drag distance multiplied by this constant while the touch is down
    SCROLL_MULTIPLIER: 1.7,

    // A drag that moves further than FAST_SWIPE_MIN_OFFSET and lasts for less than FAST_SWIPE_MAX_DURATION
    // will move to the next card in the drag direction.
    FAST_SWIPE_MAX_DURATION: 0.5,
    FAST_SWIPE_MIN_OFFSET: 20,

    // DRAG_VELOCITY_ROLLING_AVERAGE_TIME is used to calculate the rolling average velocity.
    // A higher value means the velocity adjusts slower.
    // A drag with velocity greater than FAST_SWIPE_MIN_DRAG_VELOCITY will move to the next card
    // in the direction of the velocity.
    // Test this by touching down a drag for longer than FAST_SWIPE_MAX_DURATION, and then
    // swiping and releasing.

    // A drag not classified as a fast swipe will animate to the nearest card
    FAST_SWIPE_MIN_DRAG_VELOCITY: 3.0,
    DRAG_VELOCITY_ROLLING_AVERAGE_TIME: 0.1,

    CARD_BORDER_RADIUS: 30,
  },
  FEED: {
    type: 'view',
    left: 0,
    top: 1150,
    width: '100%',
    height: 70,
    //backgroundColor: '#f00',
    onTap: () => {
      console.log('on tap');
    },
    children: [
      {
        id: 'avatar',
        type: 'image',
        borderRadius: 35,
        left: 20,
        top: 0,
        width: 70,
        height: 70,
        resizeMode: 'contain',
        onTap: () => {
          console.log('on tap 2');
        },
      },
      {
        id: 'username',
        type: 'text',
        text: 'Test text',
        left: 110,
        top: 0,
        width: 400,
        height: '100%',
        color: '#fff',
        textAlign: 'left',
        fontSize: 5,
        fontFamily: 'Overlay',
        textAlignVertical: 'center',
      }
    ],
  },
};

let coreViewGestureHandlers = {};
let gestureHandlerId = 0;

function stripGestureHandlersFromView(view) {
  if (view.onTap) {
    let id = `${gestureHandlerId++}`;
    coreViewGestureHandlers[id] = view.onTap;
    view.onTapHandlerId = id;
  }

  if (view.children) {
    for (let i = 0; i < view.children.length; i++) {
      stripGestureHandlersFromView(view.children[i]);
    }
  }
}

function getCoreViews() {
  coreViewGestureHandlers = {};

  for (const view of Object.values(coreViews)) {
    stripGestureHandlersFromView(view);
  }

  return JSON.stringify(coreViews);
}

export const NativeDecksFeed = () => {
  useListen({
    eventName: 'CORE_VIEWS_GESTURE',
    handler: (params) => {
      let gestureHandlerId = params.gestureHandlerId;
      if (coreViewGestureHandlers[gestureHandlerId]) {
        coreViewGestureHandlers[gestureHandlerId]();
      }
    },
  });

  return (
    <GameView
      initialParams={JSON.stringify({
        useNativeFeed: true,
        textOverlayStyle: Constants.CORE_OVERLAY_TEXT_STYLE,
      })}
      coreViews={getCoreViews()}
      paused={false}
    />
  );
};
