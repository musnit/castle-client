import React from 'react';
import { Keyboard } from 'react-native';
import gql from 'graphql-tag';
import ImagePicker from 'react-native-image-picker';
import { ReactNativeFile } from 'apollo-upload-client';
import * as Session from './Session';
import * as LocalId from './local-id';

import * as Constants from './Constants';

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

export const launchImagePicker = (methodName, callback = () => {}) => {
  const options = { maxWidth: 1024, maxHeight: 1024, imageFileType: 'png' };

  if (Constants.Android) {
    // URIs may some times be 'content://', this forces copying to 'file://'
    options.rotation = 360;
  }

  ImagePicker[methodName](options, async ({ didCancel, error, uri }) => {
    if (!didCancel) {
      if (error) {
        callback({ error });
      } else {
        callback({ uri });

        // Seems like we need to upload after a slight delay...
        setTimeout(async () => {
          const name = uri.match(/[^/]*$/)[0] || '';
          const extension = name.match(/[^.]*$/)[0] || '';
          const result = await Session.apolloClient.mutate({
            mutation: gql`
              mutation UploadFile($file: Upload!) {
                uploadFile(file: $file) {
                  fileId
                  url
                }
              }
            `,
            variables: {
              file: new ReactNativeFile({
                uri,
                name,
                type:
                  extension === 'jpg'
                    ? 'image/jpeg'
                    : extension === 'jpg'
                    ? 'image/jpeg'
                    : extension === 'png'
                    ? 'image/png'
                    : 'application/octet-stream',
              }),
            },
            fetchPolicy: 'no-cache',
          });
          callback(result.data.uploadFile);
        }, 80);
      }
    }
  });
};

export const launchImageLibrary = (callback) => launchImagePicker('launchImageLibrary', callback);

export const launchCamera = (callback) => launchImagePicker('launchCamera', callback);

const stringAsSearchInvariant = (string) => string.toLowerCase().trim();

export const cardMatchesSearchQuery = (card, searchQuery) => {
  if (!card) return false;
  if (!searchQuery) return true;

  const query = stringAsSearchInvariant(searchQuery);
  const title = card.title ? stringAsSearchInvariant(card.title) : '';

  if (title.startsWith(query)) return true;

  const components = title.split(/[\s\-]/);
  for (let ii = 0; ii < components.length; ii++) {
    if (components[ii].startsWith(query)) {
      return true;
    }
  }
  return false;
};

export const makeInitialDeckState = (deck) => {
  return {
    variables: deck.variables
      ? deck.variables.map((variable) => {
          return {
            ...variable,
            value: variable.initialValue,
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
