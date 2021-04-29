import React from 'react';
import { Image, Keyboard, Share } from 'react-native';
import { gql } from '@apollo/client';
import { launchImageLibrary as ImagePickerLaunchImageLibrary } from 'react-native-image-picker';
import { ReactNativeFile } from 'apollo-upload-client';
import tinycolor from 'tinycolor2';

import FastImage from 'react-native-fast-image';
import shortid from 'shortid';
import Url from 'url-parse';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from '../Constants';
import * as Session from '../Session';
import * as LocalId from './local-id';

const { sharedAction } = Share;
const CARD_TITLE_MAX_LEN = 28;

export const getTextActorsContent = (sceneData) => {
  const actors = sceneData.snapshot?.actors;
  let contents = [];
  if (actors) {
    for (let ii = 0; ii < actors.length; ii++) {
      const actor = actors[ii];
      const components = actor?.bp?.components;
      if (components && components.Text && components.Text.content) {
        contents.push(components.Text);
      }
    }
  }
  contents = contents
    .sort((a, b) => {
      if (a.order === b.order) {
        return a.content.localeCompare(b.content, 'en', { sensitivity: 'base' });
      }
      return a.order - b.order;
    })
    .map((actor) => actor.content);
  return contents;
};

export const canGoToCard = (card, isPlaying) => {
  if (!card || !card.cardId) return false;
  if (LocalId.isLocalId(card.cardId) && isPlaying) return false;
  return true;
};

export const makeCardPreviewTitle = (card, deck) => {
  if (!card || !card.cardId) {
    return 'Nonexistent card';
  }
  if (LocalId.isLocalId(card.cardId)) {
    return 'New card';
  }
  if ((!card.scene || !card.scene.data) && deck && deck.cards) {
    // card is partial. look up full card in deck, if available
    let cardToPreview = deck.cards.find((other) => other.cardId === card.cardId);
    if (cardToPreview) {
      card = cardToPreview;
    }
  }
  if (!card.scene || !card.scene.data) {
    return card.title ? card.title : 'Untitled card';
  }
  const textContents = getTextActorsContent(card.scene.data);
  if (!textContents || !textContents.length) {
    return card.title ? card.title : 'Untitled card';
  }
  let text = textContents[0];
  const firstBlockContents = text.split(/[\s]/);
  let title = '',
    ii = 0;
  while (title.length < CARD_TITLE_MAX_LEN && ii < firstBlockContents.length) {
    title += firstBlockContents[ii] + ' ';
    ii++;
  }
  if (title.length > CARD_TITLE_MAX_LEN) {
    title = title.substring(0, CARD_TITLE_MAX_LEN - 3) + '...';
  }
  return title;
};

// make preview titles for all cards in the deck, and try to de-dup
// identical card titles
export const makeCardPreviewTitles = (deck) => {
  let titles = {};
  let uniqueTitles = {};
  const sortedCards = deck.cards.sort((a, b) => a.cardId.localeCompare(b.cardId));
  for (let ii = 0; ii < sortedCards.length; ii++) {
    // visit cards in deterministic order
    const card = sortedCards[ii];
    let title = makeCardPreviewTitle(card);
    if (uniqueTitles[title]) {
      // weak de-dup: just prepend part of the card id
      const idFragment = card.cardId.substring(0, 3);
      title = `${idFragment}-${title}`;
      if (title.length > CARD_TITLE_MAX_LEN) {
        title = title.substring(0, CARD_TITLE_MAX_LEN - 3) + '...';
      }
    }
    uniqueTitles[title] = true;
    titles[card.cardId] = title;
  }
  return titles;
};

export const launchImagePicker = (methodName, callback = () => {}, opts = {}) => {
  const options = { maxWidth: 1024, maxHeight: 1024, mediaType: 'photo' };

  if (Constants.Android) {
    // URIs may some times be 'content://', this forces copying to 'file://'
    options.rotation = 360;
  }

  if (methodName !== 'launchImageLibrary') {
    throw new Error(`Currently utilities.js only supports 'launchImageLibrary'`);
  }

  ImagePickerLaunchImageLibrary(options, async ({ didCancel, error, uri }) => {
    if (!didCancel) {
      if (error) {
        callback({ error });
      } else {
        callback({ uri });

        if (!opts.noUpload) {
          // Seems like we need to upload after a slight delay...
          setTimeout(async () => {
            const result = await Session.uploadFile({ uri });
            callback(result);
          }, 80);
        }
      }
    }
  });
};

export const launchImageLibrary = (callback, opts) =>
  launchImagePicker('launchImageLibrary', callback, opts);

export const launchCamera = (callback, opts) => launchImagePicker('launchCamera', callback, opts);

const stringAsSearchInvariant = (string) => string.toLowerCase().trim();

export const cardMatchesSearchQuery = (card, searchQuery) => {
  if (!card) return false;
  if (!searchQuery) return true;

  const query = stringAsSearchInvariant(searchQuery);
  const title = card.title ? stringAsSearchInvariant(makeCardPreviewTitle(card)) : '';

  if (title.startsWith(query)) return true;

  const components = title.split(/[\s\-]/);
  for (let ii = 0; ii < components.length; ii++) {
    if (components[ii].startsWith(query)) {
      return true;
    }
  }
  return false;
};

export const makeInitialDeckState = (deck, resetValue = true) => {
  return {
    variables: deck.variables
      ? deck.variables.map((variable) => {
          return {
            ...variable,
            value: resetValue ? variable.initialValue : variable.value,
          };
        })
      : [],
  };
};

export const useKeyboard = (config = {}) => {
  const [keyboardState, setKeyboardState] = React.useState({ visible: false, height: 0 });

  function dismiss() {
    Keyboard.dismiss();
    setKeyboardState((state) => {
      return {
        ...state,
        visible: false,
      };
    });
  }

  React.useEffect(() => {
    function onKeyboardShow(e) {
      setKeyboardState({
        visible: true,
        height: e.endCoordinates.height,
      });
    }

    function onKeyboardHide(e) {
      setKeyboardState({
        visible: false,
        height: e.endCoordinates.height,
      });
    }

    Keyboard.addListener('keyboardDidShow', onKeyboardShow);
    Keyboard.addListener('keyboardDidHide', onKeyboardHide);

    return () => {
      Keyboard.removeListener('keyboardDidShow', onKeyboardShow);
      Keyboard.removeListener('keyboardDidHide', onKeyboardHide);
    };
  }, []);

  return [keyboardState, dismiss];
};

// return { urlToDisplay, urlToOpen }
//   urlToDisplay guarantees no scheme
//   urlToOpen guarantees some valid scheme
export const canonizeUserProvidedUrl = (urlStr) => {
  let urlToDisplay, urlToOpen;
  try {
    const componentsToDisplay = new Url(urlStr);
    const componentsToOpen = new Url(urlStr);

    componentsToDisplay.set('protocol', '');
    urlToDisplay = componentsToDisplay.href;
    if (urlToDisplay.indexOf('//') === 0) {
      urlToDisplay = urlToDisplay.substring(2);
    }
    if (urlToDisplay.slice(-1) == '/') {
      urlToDisplay = urlToDisplay.substring(0, urlToDisplay.length - 1);
    }
    if (
      !componentsToOpen.protocol ||
      componentsToOpen.protocol == '' ||
      componentsToOpen.protocol === 'file:'
    ) {
      componentsToOpen.set('protocol', 'https:');
    }
    urlToOpen = componentsToOpen.href;
  } catch (_) {}
  return { urlToDisplay, urlToOpen };
};

export const shareDeck = async (deck) => {
  let params;
  const cxshid = shortid.generate();
  const url = `https://castle.xyz/d/${deck.deckId}?cxshid=${cxshid}`;
  let shortUrl;
  try {
    shortUrl = await Session.createShortLink(url);
  } catch (e) {
    console.warn(`Failed to generate short url: ${e}`);
    shortUrl = url;
  }
  if (Constants.iOS) {
    params = {
      // message: `Open this deck in Castle`,
      url: shortUrl,
    };
  } else {
    params = {
      // title: 'Open this deck in Castle',
      message: shortUrl,
    };
  }
  try {
    const result = await Share.share(params);
    if (result?.action === sharedAction) {
      Amplitude.logEventWithProperties('SHARE_DECK', {
        deckId: deck.deckId,
        cxshid,
        activityType: result.activityType,
      });
    }
  } catch (_) {}
};

export const getCardBackgroundColor = (card) => {
  let baseColor, backgroundColor;
  if (card?.backgroundColor) {
    baseColor = card.backgroundColor;
  } else {
    baseColor = '#333';
  }
  let base = tinycolor(baseColor);

  // Using a brightness check rather than isDark/isLight because we mostly want to darken
  // the color to contrast with the white text only in cases where the card background
  // is very dark do we want to lighten.
  let brightness = base.getBrightness();
  if (brightness < 60) {
    backgroundColor = base.lighten(15).toRgbString();
  } else {
    backgroundColor = base.darken(15).toRgbString();
  }
  return backgroundColor;
};

export const getNotificationType = (n) => {
  if (!n?.type) return null;
  if (n.type.indexOf('react_deck_') === 0) {
    return 'reaction';
  }
  return n.type;
};

export const getNotificationReactionId = (n) => {
  if (getNotificationType(n) === 'reaction') {
    const prefixLength = 'react_deck_'.length;
    return n.type.substring(prefixLength);
  }
  return null;
};

// https://github.com/DylanVann/react-native-fast-image/issues/395#issuecomment-453850446
export const preloadImageRequires = (images) => {
  const uris = images.map((image) => ({
    uri: Image.resolveAssetSource(image).uri,
  }));

  FastImage.preload(uris);
};
