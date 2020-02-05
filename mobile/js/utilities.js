import React from 'react';
import gql from 'graphql-tag';
import ImagePicker from 'react-native-image-picker';
import { ReactNativeFile } from 'apollo-upload-client';
import * as Session from './Session';

import * as Constants from './Constants';

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
