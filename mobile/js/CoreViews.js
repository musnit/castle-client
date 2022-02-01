import { useListen } from './core/CoreEvents';
import { useNavigation } from './ReactNavigation';

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
    DRAG_START_OFFSET: 30,

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
    height: 60,
    //backgroundColor: '#f00',
    touch: 'enabled',
    children: [
      {
        id: 'avatar',
        type: 'image',
        borderRadius: 30,
        left: 20,
        top: 0,
        width: 60,
        height: 60,
        resizeMode: 'contain',
        touch: 'enabled',
        onTap: (props) => {
          props.push('Profile', { userId: props.userId });
        },
      },
      {
        id: 'username',
        type: 'text',
        left: 100,
        top: 10,
        width: 300,
        height: '100%',
        color: '#fff',
        textAlign: 'left',
        fontSize: 4.5,
        fontFamily: 'Overlay',
        textAlignVertical: 'top',
        // backgroundColor: '#f00',
        touch: 'enabled',
        onTap: (props) => {
          props.push('Profile', { userId: props.userId });
        },
      },
      {
        filename: 'comment.png',
        type: 'image',
        right: 230,
        top: -10,
        width: 70,
        height: 70,
        resizeMode: 'contain',
        touch: 'enabled',
        onTap: (params) => {
          params.onPressComments({
            deck: {
              deckId: params.deckId,
              commentsEnabled: params.commentsEnabled == 'true',
            },
          });
        },
      },
      {
        id: 'comment-count',
        type: 'text',
        right: 155,
        top: 10,
        width: 80,
        height: '100%',
        color: '#fff',
        textAlign: 'left',
        fontSize: 4.5,
        fontFamily: 'Overlay',
        textAlignVertical: 'top',
        // backgroundColor: '#f00',
        touch: 'enabled',
        onTap: (params) => {
          params.onPressComments({
            deck: {
              deckId: params.deckId,
              commentsEnabled: params.commentsEnabled == 'true',
            },
          });
        },
      },
      {
        id: 'reaction-icon',
        filename: 'fire.png',
        type: 'image',
        right: 100,
        top: -10,
        width: 70,
        height: 70,
        resizeMode: 'contain',
        touch: 'enabled',
        onTap: () => {
          console.log('on tap 2');
        },
      },
      {
        id: 'reaction-count',
        type: 'text',
        right: 25,
        top: 10,
        width: 80,
        height: '100%',
        color: '#fff',
        textAlign: 'left',
        fontSize: 4.5,
        fontFamily: 'Overlay',
        textAlignVertical: 'top',
        // backgroundColor: '#f00',
        touch: 'enabled',
      },
    ],
  },
  LEADERBOARD: {
    visibility: 'hidden',
    id: 'leaderboard',
    type: 'view',
    left: '10%',
    top: '10%',
    width: '80%',
    height: '80%',
    backgroundColor: '#151F1F',
    borderRadius: 24,
    touch: 'enabled',
    children: [
      {
        type: 'view',
        top: 18,
        left: '6%',
        width: '88%',
        height: 80,
        children: [
          {
            type: 'text',
            left: 0,
            top: 10,
            width: 300,
            height: '60',
            color: '#E3E6FD',
            textAlign: 'left',
            fontSize: 4.8,
            fontFamily: 'Overlay',
            textAlignVertical: 'top',
            text: 'Leaderboard',
          },
          {
            type: 'image',
            right: -4,
            top: 6,
            width: 46,
            height: 46,
            resizeMode: 'contain',
            url: 'https://castle.imgix.net/ff31916ab885f90b224a7365f556064b?auto=compress',
          },
        ],
      },
      {
        type: 'view',
        top: 95,
        left: '6%',
        width: '88%',
        height: 80,
        children: [
          {
            visibility: 'hidden',
            id: 'editorText',
            type: 'text',
            left: '10%',
            top: 250,
            width: '80%',
            height: '400',
            color: '#E3E6FD',
            textAlign: 'left',
            fontSize: 4.8,
            fontFamily: 'Overlay',
            textAlignVertical: 'top',
            text: 'This will show a leaderboard when playing the deck outside the editor.',
          },
          {
            id: 'username',
            type: 'text',
            left: 90,
            top: 10,
            width: 300,
            height: '60',
            color: '#E3E6FD',
            textAlign: 'left',
            fontSize: 4,
            fontFamily: 'Overlay',
            textAlignVertical: 'top',
            text: 'Name',
          },
          {
            id: 'label',
            type: 'text',
            right: 0,
            top: 10,
            width: 150,
            height: '60',
            color: '#E3E6FD',
            textAlign: 'right',
            fontSize: 4,
            fontFamily: 'Overlay',
            textAlignVertical: 'top',
            text: 'Score',
          },
        ],
      },
    ],
  },
};

for (let i = 1; i <= 10; i++) {
  coreViews.LEADERBOARD.children.push({
    type: 'view',
    top: 83 + 73 * i,
    left: '6%',
    width: '88%',
    height: 80,
    children: [
      {
        id: 'place-' + i,
        type: 'text',
        left: 0,
        top: 15,
        width: 300,
        height: '60',
        color: '#E3E6FD',
        textAlign: 'left',
        fontSize: 4,
        fontFamily: 'Overlay',
        textAlignVertical: 'top',
        //text: '#' + i,
      },
      {
        id: 'avatar-' + i,
        type: 'image',
        borderRadius: 30,
        left: 90,
        top: 2,
        width: 54,
        height: 54,
        resizeMode: 'contain',
        //url: 'https://castle.imgix.net/e9826782deed21a5b952a37b4861aeed?auto=compress&fit=crop&max-w=128&max-h=128&ar=1:1',
      },
      {
        id: 'username-' + i,
        type: 'text',
        left: 170,
        top: 10,
        width: 300,
        height: '60',
        color: '#E3E6FD',
        textAlign: 'left',
        fontSize: 4.5,
        fontFamily: 'Overlay',
        textAlignVertical: 'top',
        //text: 'jesse',
      },
      {
        id: 'score-' + i,
        type: 'text',
        right: 0,
        top: 10,
        width: 150,
        height: '60',
        color: '#E3E6FD',
        textAlign: 'right',
        fontSize: 4.5,
        fontFamily: 'Overlay',
        textAlignVertical: 'top',
        //text: '4772199',
      },
    ],
  });
}

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

export function getCoreViews() {
  coreViewGestureHandlers = {};
  gestureHandlerId = 0;

  for (const view of Object.values(coreViews)) {
    stripGestureHandlersFromView(view);
  }

  // printCoreViewsJSON(coreViews);

  return JSON.stringify(coreViews);
}

export function useCoreViews(opts) {
  const { push, navigate } = useNavigation();

  useListen({
    eventName: 'CORE_VIEWS_GESTURE',
    handler: (params) => {
      let props = {};
      try {
        props = JSON.parse(params.props);
      } catch (e) {}

      props = {
        ...props,
        push,
        navigate,
        ...opts,
      };

      let gestureHandlerId = params.gestureHandlerId;
      if (coreViewGestureHandlers[gestureHandlerId]) {
        coreViewGestureHandlers[gestureHandlerId](props);
      }
    },
  });
}

function printCoreViewsJSON(json) {
  let str = JSON.stringify(json);
  let result = '\n#pragma once\n\n#include "precomp.h"\n\nconst std::string CORE_VIEWS_JSON = \n';
  let charsPerLine = 80;
  for (let i = 0; i < str.length; i += charsPerLine) {
    result += '  ' + JSON.stringify(str.substring(i, Math.min(str.length, i + charsPerLine)));
    if (i + charsPerLine < str.length) {
      result += '\n';
    } else {
      result += ';\n';
    }
  }

  console.log(result);
}
