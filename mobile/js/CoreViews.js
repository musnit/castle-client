import React from 'react';
import { Platform } from 'react-native';
import { useListen } from './core/CoreEvents';
import { useNavigation } from './ReactNavigation';
import { useFocusEffect } from './ReactNavigation';
import { apolloClient } from './Session';
import { gql } from '@apollo/client';

let FEED_ICON_SIZE = '5.5vw';
let FEED_ICON_TOP = '2.7vw';
let FEED_FONT_SIZE = '0.45vw';
let FEED_TEXT_TOP = '3.4vw';

function onPressComments(params) {
  let deck = {
    ...JSON.parse(params.deck),
    commentsEnabled: params.commentsEnabled == 'true',
  };

  if (params.reactionCount) {
    deck.reactions = [
      {
        count: parseInt(params.reactionCount),
        isCurrentUserToggled: params.isCurrentUserReactionToggled == 'true',
        reactionId: 'fire',
      },
    ];
  }

  params.onPressComments({
    deck,
  });
}

let coreViews = {
  CONSTANTS: {
    FEED_BOTTOM_ACTIONS_INITIAL_RIGHT: 13.3,

    FEED_BOTTOM_ACTIONS_TEXT_RIGHT_PADDING: 2.5,

    FEED_BOTTOM_ACTIONS_REACTION_ICON_RIGHT_PADDING: Platform.OS == 'android' ? 1.8 : 2.4,
    FEED_BOTTOM_ACTIONS_SPACE_REACTION_BUTTON_AND_TEXT: 0.5,
    FEED_BOTTOM_ACTIONS_MAX_DIFF_BEFORE_REACTION_RELAYOUT: 1.5,

    FEED_BOTTOM_ACTIONS_COMMENT_ICON_RIGHT_PADDING: 3,
    FEED_BOTTOM_ACTIONS_SPACE_COMMENT_BUTTON_AND_TEXT: 1.0,

    FEED_BOTTOM_ACTIONS_CAPTION_DEFAULT_LEFT: 3.5,
    FEED_BOTTOM_ACTIONS_REMIX_BORDER_EXTRA_WIDTH: 8,
    FEED_BOTTOM_ACTIONS_REMIX_CAPTION_PADDING: 13.5,
    FEED_BOTTOM_ACTIONS_CAPTION_OVERLAY_LEFT_EXTRA_WIDTH: 8,
    FEED_BOTTOM_ACTIONS_CAPTION_OVERLAY_GRADIENT_LEFT_PADDING: 11,

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
     * 9 - linear
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
  FEED_ERROR: {
    id: 'container',
    type: 'view',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    // backgroundColor: '#f00',
    touch: 'enabled',
    children: [
      {
        id: 'error-text',
        type: 'text',
        text: '',
        color: '#fff',
        fontSize: '0.6vw',
        fontFamily: 'BaltoBook',
        width: '50%',
        height: '50%',
        left: '25%',
        top: '25%',
        textAlign: 'center',
        textAlignVertical: 'center',
      },
      {
        id: 'reload-icon',
        filename: 'reload.png',
        type: 'image',
        left: '45%',
        top: '50%',
        width: '10%',
        height: '10%',
        resizeMode: 'contain',
        touch: 'enabled',
        hitSlopLeft: '20%',
        hitSlopRight: '20%',
        hitSlopBottom: '20%',
        hitSlopTop: '20%',
      },
    ],
  },
  FEED_NUX: {
    id: 'container',
    type: 'view',
    left: 0,
    top: '100%',
    width: '100%',
    height: 60,
    children: [
      {
        id: 'nux-gesture',
        type: 'image',
        top: 0,
        left: 0,
        width: '80vw',
        height: '24vw',
        filename: 'nux-gesture.png',
        resizeMode: 'contain',
      },
    ],
  },
  FEED_AVATAR: {
    id: 'container',
    type: 'view',
    left: 0,
    top: '100%',
    width: '100%',
    height: 60,
    // backgroundColor: '#f00',
    touch: 'enabled',
    children: [
      // User
      {
        id: 'avatar',
        type: 'image',
        borderRadius: '3.2vw',
        left: 0, //'3.5vw',
        top: '2.5vw',
        width: '6.4vw',
        height: '6.4vw',
        hitSlopLeft: '4vw',
        hitSlopBottom: '2vw',
        hitSlopTop: '5vw',
        resizeMode: 'contain',
        touch: 'enabled',
        // backgroundColor: '#f00',
        onTap: (params) => {
          params.push('Profile', { userId: params.userId });
        },
      },
    ],
  },
  FEED: {
    id: 'container',
    type: 'view',
    left: 0,
    top: '100%',
    width: '100%',
    height: 60,
    // backgroundColor: '#f00',
    touch: 'enabled',
    children: [
      // User
      {
        id: 'username',
        type: 'text',
        left: '15vw',
        top: FEED_TEXT_TOP,
        width: '45vw',
        height: '5vw',
        color: '#fff',
        textAlign: 'left',
        fontSize: FEED_FONT_SIZE,
        fontFamily: 'BaltoMedium',
        textAlignVertical: 'top',
        // backgroundColor: '#f00',
        hitSlopLeft: '3vw',
        hitSlopBottom: '5vw',
        hitSlopTop: '5vw',
        touch: 'enabled',
        onTap: (params) => {
          params.push('Profile', { userId: params.userId });
        },
      },

      // Comments
      {
        id: 'comment-icon',
        filename: 'comment.png',
        type: 'image',
        right: '32.5vw',
        top: FEED_ICON_TOP,
        width: FEED_ICON_SIZE,
        height: FEED_ICON_SIZE,
        hitSlopBottom: '5vw',
        hitSlopTop: '5vw',
        hitSlopLeft: '5vw',
        resizeMode: 'contain',
        touch: 'enabled',
        // backgroundColor: '#0f0',
        onTap: onPressComments,
      },
      {
        id: 'comment-count',
        type: 'text',
        right: '23.5vw',
        top: FEED_TEXT_TOP,
        width: '8vw',
        height: '5vw',
        hitSlopLeft: '2vw',
        hitSlopBottom: '5vw',
        hitSlopTop: '5vw',
        color: '#fff',
        textAlign: 'left',
        fontSize: FEED_FONT_SIZE,
        fontFamily: 'BaltoBook',
        textAlignVertical: 'top',
        // backgroundColor: '#f00',
        touch: 'enabled',
        onTap: onPressComments,
      },

      // Reactions
      {
        id: 'reaction-icon',
        filename: 'fire.png',
        type: 'image',
        right: '18.5vw',
        top: '2.5vw',
        width: FEED_ICON_SIZE,
        height: FEED_ICON_SIZE,
        hitSlopBottom: '5vw',
        hitSlopTop: '5vw',
        resizeMode: 'contain',
        touch: 'enabled',
        // backgroundColor: '#0f0',
      },
      {
        id: 'reaction-count',
        type: 'text',
        right: '10vw',
        top: FEED_TEXT_TOP,
        width: '8vw',
        height: '5vw',
        hitSlopLeft: '2vw',
        hitSlopBottom: '5vw',
        hitSlopTop: '5vw',
        color: '#fff',
        textAlign: 'left',
        fontSize: FEED_FONT_SIZE,
        fontFamily: 'BaltoBook',
        textAlignVertical: 'top',
        // backgroundColor: '#f00',
        touch: 'enabled',
      },

      // Share
      {
        id: 'share-icon',
        filename: Platform.OS === 'android' ? 'share-android.png' : 'share-ios.png',
        type: 'image',
        right: '7vw',
        top: Platform.OS == 'android' ? '2.7vw' : '2.5vw',
        width: FEED_ICON_SIZE,
        height: FEED_ICON_SIZE,
        hitSlopLeft: '1.5vw',
        hitSlopRight: '3vw',
        hitSlopBottom: '5vw',
        hitSlopTop: '5vw',
        resizeMode: 'contain',
        touch: 'enabled',
        // backgroundColor: '#f00',
        onTap: (params) => {
          params.onShowPopover(params);
        },
      },

      // Caption
      {
        id: 'caption',
        type: 'text',
        left: '3.5vw',
        top: '12vw',
        width: '10000vw',
        height: '5vw',
        color: '#fff',
        textAlign: 'left',
        fontSize: '0.35vw',
        fontFamily: 'BaltoBook',
        textAlignVertical: 'top',
        // backgroundColor: '#f00',
        // touch: 'enabled',
      },

      {
        id: 'caption2',
        type: 'text',
        left: '3.5vw',
        top: '18vw',
        width: '10000vw',
        height: '5vw',
        color: '#fff',
        textAlign: 'left',
        fontSize: '0.35vw',
        fontFamily: 'BaltoBook',
        textAlignVertical: 'top',
        text: "blah blah blahlaj  alskjfla alsjdflasjdlf alsdjflajlsd alldsfla sfllajsljdfljsad",
      },

      {
        id: 'caption3',
        type: 'text',
        left: '3.5vw',
        top: '24vw',
        width: '10000vw',
        height: '5vw',
        color: '#fff',
        textAlign: 'left',
        fontSize: '0.35vw',
        fontFamily: 'BaltoBook',
        textAlignVertical: 'top',
        text: "blah blah blahlaj  alskjfla alsjdflasjdlf alsdjflajlsd alldsfla sfllajsljdfljsad",
      },

      {
        id: 'caption-overlay-left-remix-2',
        type: 'view',
        backgroundColor: '#000',
        left: '-100vw',
        top: '12vw',
        width: '110vw',
        height: '5vw',
        visibility: 'hidden',
      },

      {
        id: 'caption-overlay-left-remix',
        type: 'view',
        backgroundColor: '#000',
        left: '3.2vw',
        top: '12vw',
        width: '30vw',
        height: '5vw',
        visibility: 'hidden',
      },

      {
        id: 'caption-overlay-left-remix-gradient',
        type: 'image',
        filename: 'gradient-2.png',
        left: '25vw',
        top: '12vw',
        width: '2.5vw',
        height: '5vw',
        visibility: 'hidden',
      },

      {
        id: 'caption-overlay-left',
        type: 'image',
        filename: 'gradient-2.png',
        left: '-8vw',
        top: '12vw',
        width: '10vw',
        height: '5vw',
      },

      {
        id: 'caption-overlay-left-2',
        type: 'view',
        backgroundColor: '#000',
        left: '-30vw',
        top: '12vw',
        width: '23vw',
        height: '5vw',
      },

      {
        id: 'caption-overlay-right',
        type: 'image',
        filename: 'gradient.png',
        right: '-8vw',
        top: '12vw',
        width: '10vw',
        height: '5vw',
      },

      {
        id: 'caption-overlay-rigth-2',
        type: 'view',
        backgroundColor: '#000',
        left: '108vw',
        top: '12vw',
        width: '30vw',
        height: '5vw',
      },

      // Remix
      {
        id: 'remix-border',
        type: 'view',
        left: '3.2vw',
        top: '11vw',
        width: '40vw',
        height: '5.6vw',
        visibility: 'hidden',
        backgroundColor: '#000',
        borderColor: '#fff',
        borderWidth: '0.2vw',
        borderRadius: '1vw',
      },
      {
        id: 'remix-icon',
        filename: 'remix-attribution-white.png',
        type: 'image',
        left: '5vw',
        top: '12.3vw',
        width: '3vw',
        height: '3vw',
        hitSlopLeft: '1.5vw',
        hitSlopRight: '3vw',
        hitSlopBottom: '5vw',
        hitSlopTop: '0vw',
        resizeMode: 'contain',
        touch: 'enabled',
        visibility: 'hidden',
        touch: 'enabled',
        onTap: (params) => {
          params.onNavigateToParent(params);
        },
      },
      {
        id: 'remix-text',
        type: 'text',
        left: '9.3vw',
        top: '12.3vw',
        width: '60vw',
        height: '5vw',
        hitSlopLeft: '1.5vw',
        hitSlopBottom: '5vw',
        hitSlopTop: '0vw',
        color: '#fff',
        textAlign: 'left',
        fontSize: '0.32vw',
        fontFamily: 'BaltoBook',
        textAlignVertical: 'top',
        visibility: 'hidden',
        // backgroundColor: '#f00',
        touch: 'enabled',
        onTap: (params) => {
          params.onNavigateToParent(params);
        },
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
    backgroundColor: '#242234',
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
            filename: 'leaderboard-x.png',
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

  //printCoreViewsJSON(coreViews);
  //printEmbeddedDecks();

  return JSON.stringify(coreViews);
}

export function useCoreViews(opts) {
  const { push, navigate } = useNavigation();

  const [isFocused, setIsFocused] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);

      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  useListen({
    eventName: 'CORE_VIEWS_GESTURE',
    handler: React.useCallback(
      (params) => {
        if (!isFocused) {
          return;
        }

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
      [isFocused]
    ),
  });
}

function printCXXString(str, includeSemicolon = true) {
  let result = '\n';
  let charsPerLine = 80;
  for (let i = 0; i < str.length; i += charsPerLine) {
    result += '  ' + JSON.stringify(str.substring(i, Math.min(str.length, i + charsPerLine)));
    if (i + charsPerLine < str.length) {
      result += '\n';
    } else {
      if (includeSemicolon) {
        result += ';';
      }

      result += '\n';
    }
  }
  return result;
}

function printCoreViewsJSON(json) {
  let str = JSON.stringify(json);
  let result =
    '\n#pragma once\n\n#include "precomp.h"\n\nconst std::string CORE_VIEWS_JSON = ' +
    printCXXString(str);

  console.log(result);
}

function unsignedCharArrayFromString(str) {
  let result = '{';
  let length = 0;

  for (var i = 0; i < str.length; i++) {
    let char = str.charCodeAt(i).toString(16);
    length++;
    if (char.length > 2) {
      /*console.log(char + '  ' + str.charAt(i) + '  ' + char.substring(0, 2) + '  ' + char.substring(2))

      length++;
      if (char.length < 4) {
        char = '0' + char;
      }

      result += '0x' + char.substring(0, 2) + ', '

      char = char.substring(2);*/

      char = ' '.charCodeAt(0).toString(16);
    }

    if (char.length == 1) {
      char = '0' + char;
    } else if (char.length == 0) {
      char = '00';
    }
    char = '0x' + char;

    result += char;
    if (i < str.length - 1) {
      result += ', ';
    }

    if (i % 10 == 9) {
      result += '\n';
    }
  }

  result += '}';

  return {
    result,
    length,
  };
}

let printedEmbeddedDecks = false;
async function printEmbeddedDecks() {
  if (printedEmbeddedDecks) {
    return;
  }
  printedEmbeddedDecks = true;

  let decks = [];
  let cards = [];
  await addEmbeddedDeck('lSTWWH6Kw', decks, cards);

  let arraySection = '';
  let id = 0;

  let result = '';
  result +=
    'const std::unordered_map<std::string, std::pair<unsigned char *, unsigned int>> DECK_ID_TO_DATA = {\n';
  let deckIds = Object.keys(decks);
  for (let i = 0; i < deckIds.length; i++) {
    let deckId = deckIds[i];
    let currentId = 'EMBEDDED_DECK_DATA_' + id++;
    let charArray = unsignedCharArrayFromString(decks[deckId]);
    arraySection += 'unsigned char ' + currentId + '[] = ' + charArray.result + ';\n\n';
    result +=
      '{"' +
      deckId +
      '", std::make_pair(' +
      currentId +
      ', (unsigned int)' +
      charArray.length +
      ')}';

    result += ',\n';
  }
  result += '};\n\n';

  result +=
    'const std::unordered_map<std::string, std::pair<unsigned char *, unsigned int>> CARD_ID_TO_DATA = {\n';
  let cardIds = Object.keys(cards);
  for (let i = 0; i < cardIds.length; i++) {
    let cardId = cardIds[i];
    let currentId = 'EMBEDDED_DECK_DATA_' + id++;
    let charArray = unsignedCharArrayFromString(cards[cardId]);
    arraySection += 'unsigned char ' + currentId + '[] = ' + charArray.result + ';\n\n';
    result +=
      '{"' +
      cardId +
      '", std::make_pair(' +
      currentId +
      ', (unsigned int)' +
      charArray.length +
      ')}';

    result += ',\n';
  }
  result += '};\n';

  console.log('\n#pragma once\n\n#include "precomp.h"\n\n' + arraySection + result);
}

async function addEmbeddedDeck(deckId, decks, cards) {
  const result = await apolloClient.query({
    query: gql`
      query GetDeck($deckId: ID!) {
        deck(deckId: $deckId) {
          deckId
          caption
          lastModified
          variables
          childDecksCount
          creator {
            userId
            username
            photo {
              smallAvatarUrl
              url
            }
          }
          cards {
            cardId
            sceneDataUrl
          }
          initialCard {
            cardId
            sceneDataUrl
            backgroundImage {
              smallUrl
            }
          }
          commentsEnabled
          comments {
            count
          }
          reactions {
            reactionId
            isCurrentUserToggled
            count
          }
        }
      }
    `,
    variables: { deckId },
    fetchPolicy: 'no-cache',
  });

  decks[result.data.deck.deckId] = JSON.stringify(result.data.deck);

  for (let i = 0; i < result.data.deck.cards.length; i++) {
    let sceneDataUrl = result.data.deck.cards[i].sceneDataUrl;
    let dataResponse = await fetch(sceneDataUrl);
    cards[result.data.deck.cards[i].cardId] = JSON.stringify((await dataResponse.json()).snapshot);
  }
}
