import React from 'react';
import { GameView } from '../game/GameView';
import { useListen } from '../core/CoreEvents';
import * as Constants from '../Constants';

let coreViews = {
  FEED: {
    id: 'image1',
    type: 'view',
    x: 100,
    y: 200,
    width: 600,
    height: 700,
    backgroundColor: '#7F0000',
    onTap: () => {
      console.log('on tap');
    },
    children: [
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
