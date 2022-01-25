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

    CARD_BORDER_RADIUS: 50,
  },
  FEED: {
    id: 'image1',
    type: 'view',
    right: '25%',
    top: 200,
    width: '50%',
    height: 700,
    backgroundColor: '#7F0000',
    onTap: () => {
      console.log('on tap');
    },
    /*children: [
      {
        id: 'image2',
        type: 'image',
        //borderRadius: 100,
        backgroundColor: '#ccc',
        x: 50,
        y: 250,
        width: 100,
        height: 100,
        //url: 'https://castle.imgix.net/235c0b44f27876200a91f03912659e8c?auto=compress&fit=crop&min-w=420&ar=5:7',
        filename: 'fire-selected.png',
        resizeMode: 'contain',
        onTap: () => {
          console.log('on tap 2');
        },
      },
      {
        type: 'text',
        text: 'Test text',
        x: 200,
        y: 0,
        width: 400,
        height: 200,
        color: '#00FFFF',
        backgroundColor: '#222',
        textAlign: 'center',
        fontSize: 8,
        fontFamily: 'Overlay',
      }
    ],*/
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
