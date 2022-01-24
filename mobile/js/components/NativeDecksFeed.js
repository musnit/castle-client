import React from 'react';
import { GameView } from '../game/GameView';
import { useListen } from '../core/CoreEvents';
import * as Constants from '../Constants';

let coreViews = {
  FEED: {
    id: 'image1',
    type: 'Image',
    x: 100,
    y: 500,
    width: 500,
    height: 200,
    backgroundColor: '#ff0000',
    onTap: () => {
      console.log('on tap');
    },
    children: [
      {
        id: 'image2',
        type: 'Image',
        x: 100,
        y: 50,
        width: 100,
        height: 100,
        backgroundColor: '#00ff00',
        onTap: () => {
          console.log('on tap 2');
        },
      },
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

  console.log(coreViews);

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
