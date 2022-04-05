import React, { useEffect, useState } from 'react';
import debounce from 'lodash.debounce';
import FastImage from 'react-native-fast-image';
import { CastleAsyncStorage } from './common/CastleAsyncStorage';
import { NativeModules, Platform } from 'react-native';
import { gql, ApolloClient, ApolloLink, Observable } from '@apollo/client';
import { InMemoryCache } from '@apollo/client/cache';
import { onError } from '@apollo/client/link/error';
import { createUploadLink, ReactNativeFile } from 'apollo-upload-client';

import * as AdjustEvents from './common/AdjustEvents';
import * as Constants from './Constants';
import * as GhostChannels from './ghost/GhostChannels';
import * as LocalId from './common/local-id';
import * as PushNotifications from './PushNotifications';
import * as EventEmitter from './EventEmitter';
import * as Sentry from '@sentry/react-native';
import * as Analytics from './common/Analytics';

const SKIP_NUX = false;

let gAuthToken,
  gUserId,
  gIsAnonymous = false,
  gIsNuxCompleted = false,
  gIsNativeFeedNuxCompleted = false,
  gIsMuted = false;
let gNotificationState = {};
const TEST_AUTH_TOKEN = null;
let gIsAdmin = false;

const EMPTY_SESSION = {
  authToken: null,
  notifications: null,
  notificationsBadgeCount: 0,
  newFollowingDecks: false,
};

const SessionContext = React.createContext(EMPTY_SESSION);

export const isAdmin = () => {
  return gIsAdmin;
};

PushNotifications.addTokenListener(async (token) => {
  if (!gAuthToken) {
    return false;
  }

  let platform = await PushNotifications.getPlatformAsync();

  try {
    let response = await apolloClient.mutate({
      mutation: gql`
        mutation UpdatePushToken($token: String!, $platform: String!) {
          updatePushToken(token: $token, platform: $platform)
        }
      `,
      variables: { token, platform },
    });

    if (!response.data || response.errors) {
      return false;
    }
  } catch (e) {
    return false;
  }

  return true;
});

export async function loadAuthTokenAsync() {
  if (SKIP_NUX) {
    gIsNuxCompleted = true;
    gIsNativeFeedNuxCompleted = true;
    await CastleAsyncStorage.setItem('IS_NUX_COMPLETED', gIsNuxCompleted.toString());
    await CastleAsyncStorage.setItem('IS_NATIVE_FEED_NUX_COMPLETED', gIsNuxCompleted.toString());
  }

  if (gAuthToken) {
    return;
  }

  if (TEST_AUTH_TOKEN) {
    gAuthToken = TEST_AUTH_TOKEN;
  } else {
    gAuthToken = await CastleAsyncStorage.getItem('AUTH_TOKEN');
    gUserId = await CastleAsyncStorage.getItem('USER_ID');
    const isNuxCompletedStorageValue = await CastleAsyncStorage.getItem('IS_NUX_COMPLETED');
    gIsNuxCompleted = isNuxCompletedStorageValue === 'true' || isNuxCompletedStorageValue === true;
    const isNativeFeedNuxCompletedStorageValue = await CastleAsyncStorage.getItem(
      'IS_NATIVE_FEED_NUX_COMPLETED'
    );
    gIsNativeFeedNuxCompleted =
      isNativeFeedNuxCompletedStorageValue === 'true' ||
      isNativeFeedNuxCompletedStorageValue === true;
    const isAnonStorageValue = await CastleAsyncStorage.getItem('USER_IS_ANONYMOUS');
    gIsAnonymous = isAnonStorageValue === 'true' || isAnonStorageValue === true;
    const isMutedStorageValue = await CastleAsyncStorage.getItem('IS_MUTED');
    gIsMuted = isMutedStorageValue === 'true' || isMutedStorageValue === true;
    Analytics.setUserId(gUserId);
    AdjustEvents.setUserId(gUserId);
    Sentry.setUser({
      id: gUserId,
    });
  }
}

export class Provider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...EMPTY_SESSION,
      authToken: null,
      isSignedIn: false,
      userId: null,
      isAnonymous: false,
      isMuted: false,
      initialized: false,
      signInAsync: this.signInAsync,
      signOutAsync: this.signOutAsync,
      signUpAsync: this.signUpAsync,
      validateSignupAsync: this.validateSignupAsync,
      signInAsAnonymousUserAsync: this.signInAsAnonymousUserAsync,
      markNotificationsReadAsync: this.markNotificationsReadAsync,
      markFollowingFeedRead: this.markFollowingFeedRead,
      setIsNuxCompleted: this.setIsNuxCompleted,
      setIsNativeFeedNuxCompleted: this.setIsNativeFeedNuxCompleted,
      setIsMuted: this.setIsMuted,
      ...gNotificationState,
    };
  }

  async componentDidMount() {
    this._mounted = true;
    if (!this.state.initialized) {
      await loadAuthTokenAsync();

      if (this._mounted) {
        this.setState({
          authToken: gAuthToken,
          isSignedIn: !!gAuthToken,
          isAnonymous: gIsAnonymous,
          isNuxCompleted: gIsNuxCompleted,
          isNativeFeedNuxCompleted: gIsNativeFeedNuxCompleted,
          isMuted: gIsMuted,
          userId: gUserId,
          initialized: true,
        });
      }
    }

    this._notificationsListener = EventEmitter.addListener(
      'notifications',
      (notificationsState) => {
        gNotificationState = {
          ...gNotificationState,
          ...notificationsState,
        };
        this.setState(notificationsState);
      }
    );
  }

  componentWillUnmount() {
    this._mounted = false;
    EventEmitter.removeListener(this._notificationsListener);
  }

  setIsNuxCompleted = async (isNuxCompleted) => {
    gIsNuxCompleted = !!isNuxCompleted;
    if (Platform.OS === 'android') {
      GhostChannels.markNuxComplete();
    }
    await CastleAsyncStorage.setItem('IS_NUX_COMPLETED', gIsNuxCompleted.toString());
    return this.setState({ isNuxCompleted: gIsNuxCompleted });
  };

  setIsNativeFeedNuxCompleted = async (isNativeFeedNuxCompleted) => {
    gIsNativeFeedNuxCompleted = !!isNativeFeedNuxCompleted;
    if (Platform.OS === 'android') {
      GhostChannels.markNuxComplete();
    }
    await CastleAsyncStorage.setItem(
      'IS_NATIVE_FEED_NUX_COMPLETED',
      gIsNativeFeedNuxCompleted.toString()
    );
    return this.setState({ isNativeFeedNuxCompleted: gIsNativeFeedNuxCompleted });
  };

  /**
    This only sets the storage flag, doesn't tell the engine to mute/unmute.
    `CardScene` reads the storage flag and sets engine muted state on mount.
  */
  setIsMuted = async (isMuted) => {
    gIsMuted = !!isMuted;
    await CastleAsyncStorage.setItem('IS_MUTED', gIsMuted.toString());
    return this.setState({ isMuted: gIsMuted });
  };

  useNewAuthTokenAsync = async ({ userId, token, isAnonymous, isAdmin }) => {
    if (!TEST_AUTH_TOKEN) {
      apolloClient.cache.reset(); // https://github.com/apollographql/apollo-client/issues/3766
      apolloClient.resetStore();
      gAuthToken = token;
      gUserId = userId;
      gIsAnonymous = !!isAnonymous;
      notifLastFetchTime = null; // want to reload notifs for new user

      // don't reset nux state here (logging in/out doesn't affect this)

      if (token) {
        await CastleAsyncStorage.setItem('AUTH_TOKEN', token);
        await CastleAsyncStorage.setItem('USER_ID', userId);
        await CastleAsyncStorage.setItem('USER_IS_ANONYMOUS', gIsAnonymous.toString());

        Analytics.setUserId(gUserId);
        AdjustEvents.setUserId(gUserId);
        Sentry.setUser({
          id: gUserId,
        });
        Analytics.setUserProperties({
          isAnonymous: gIsAnonymous,
          isAdmin: isAdmin === true ? isAdmin : undefined,
        });
      } else {
        await CastleAsyncStorage.removeItem('AUTH_TOKEN');
        await CastleAsyncStorage.removeItem('USER_ID');
        await CastleAsyncStorage.removeItem('USER_IS_ANONYMOUS');
        await PushNotifications.clearTokenAsync();
        Analytics.setUserId(null);
        AdjustEvents.clearUserId();
        Sentry.configureScope((scope) => scope.setUser(null));
        Analytics.clearUserProperties();
        setNotifBadge(0);
      }
    }

    return this.setState({
      authToken: gAuthToken,
      isSignedIn: !!gAuthToken,
      userId: gUserId,
      isAnonymous: gIsAnonymous,
    });
  };

  signInAsync = async ({ username, password }) => {
    const userId = await userIdForUsernameAsync(username);
    const result = await apolloClient.mutate({
      mutation: gql`
        mutation SignIn($userId: ID!, $password: String!) {
          login(userId: $userId, password: $password) {
            userId
            token
            isAnonymous
            isAdmin
            photo {
              url
            }
          }
        }
      `,
      variables: { userId, password },
    });
    if (result && result.data && result.data.login && result.data.login.userId) {
      if (Platform.OS == 'android') {
        try {
          GhostChannels.saveSmartLockCredentials(username, password, result.data.login.photo.url);
        } catch (e) {}
      }

      await this.useNewAuthTokenAsync(result.data.login);
      Analytics.logEvent('SIGN_IN'); // user id already set for amplitude

      // Send our push token to the new user id
      await PushNotifications.clearTokenAsync();
      PushNotifications.requestTokenAsync();
    }
  };

  signOutAsync = async () => {
    await apolloClient.mutate({
      mutation: gql`
        mutation SignOut {
          logout
        }
      `,
    });
    Analytics.logEvent('SIGN_OUT'); // user id is still set in amplitude
    await this.useNewAuthTokenAsync({}); // clear user id
  };

  signUpAsync = async ({ username, name, email, password }) => {
    const result = await apolloClient.mutate({
      mutation: gql`
        mutation SignUp($name: String!, $username: String!, $email: String!, $password: String!) {
          signupV2(user: { name: $name, username: $username }, email: $email, password: $password) {
            user {
              userId
              token
              isAnonymous
              photo {
                url
              }
            }
            errors {
              username
              email
              password
              global
            }
          }
        }
      `,
      variables: { username, name, email, password },
    });

    if (result && result.data && result.data.signupV2 && result.data.signupV2.user && result.data.signupV2.user.userId) {
      if (Platform.OS == 'android') {
        try {
          GhostChannels.saveSmartLockCredentials(username, password, result.data.signupV2.user.photo.url);
        } catch (e) {}
      }

      await this.useNewAuthTokenAsync(result.data.signupV2.user);
      Analytics.logEvent('SIGN_UP'); // user id already set for amplitude
      AdjustEvents.trackEvent(AdjustEvents.tokens.SIGN_UP);
    }

    return result.data.signupV2;
  };

  validateSignupAsync = async ({ username, email, password }) => {
    const result = await apolloClient.query({
      query: gql`
        query ValidateSignup($username: String!, $email: String!, $password: String!) {
          validateSignup(user: { username: $username }, email: $email, password: $password) {
            username
            email
            password
            global
            isUsernameAvailable
          }
        }
      `,
      variables: { username, email, password },
    });

    if (result && result.data && result.data.validateSignup) {
      return result.data.validateSignup;
    }

    return {};
  };

  signInAsAnonymousUserAsync = async () => {
    const response = await apolloClient.mutate({
      mutation: gql`
        mutation {
          createAnonymousUser {
            userId
            token
            isAnonymous
          }
        }
      `,
    });

    if (
      !response.data ||
      !response.data.createAnonymousUser ||
      !response.data.createAnonymousUser.token
    ) {
      if (response.errors) {
        throw new Error(`Couldn't create anon user: ${response.errors[0]}`);
      } else {
        throw new Error(`Couldn't create anon user: no token: ${JSON.stringify(response)}`);
      }
    }

    await this.useNewAuthTokenAsync(response.data.createAnonymousUser);
    return response.data.createAnonymousUser;
  };

  markNotificationsReadAsync = async (opts) => {
    let unreadIds = opts?.unreadIds ?? null;
    if (!unreadIds?.length) {
      // mark all as read if none are specified
      unreadIds = this.state.notifications
        ? this.state.notifications.filter((n) => n.status === 'unseen').map((n) => n.notificationId)
        : null;
      if (!unreadIds?.length) {
        return;
      }
    }
    try {
      await _sendMarkNotificationsRead({ notificationIds: unreadIds });
    } catch (_) {
      console.warn(`Network request to mark notifs read failed, marking locally read anyway`);
    }
    return this.setState((state) => {
      const notifications = state.notifications.map((n) => {
        if (unreadIds.includes(n.notificationId)) {
          return {
            ...n,
            status: 'seen',
          };
        }

        return n;
      });
      return {
        ...state,
        notifications,
      };
    });
  };

  markFollowingFeedRead = () => {
    try {
      // don't await
      _sendMarkFollowingFeedRead();
    } catch (_) {
      console.warn(
        `Network request to mark following feed read failed, marking locally read anyway`
      );
    }
    return this.setState({ newFollowingDecks: false });
  };

  render() {
    return (
      <SessionContext.Provider value={this.state}>{this.props.children}</SessionContext.Provider>
    );
  }
}

export const useSession = () => React.useContext(SessionContext);

// for checking auth state outside of react component tree
export const isSignedIn = () => gAuthToken !== null;
export const isAnonymous = () => gIsAnonymous;

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) =>
          console.log(
            `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(
              locations
            )}, Path: ${path}`
          )
        );
      }
      if (networkError) {
        console.log(`[Network error]: ${networkError}`);
      }
    }),
    new ApolloLink(
      (operation, forward) =>
        new Observable((observer) => {
          let handle;
          Promise.resolve(operation)
            .then((operation) => {
              const headers = {};
              headers['X-Platform'] = 'mobile';
              headers['X-OS'] = Platform.OS;
              headers['X-Build-Version-Code'] =
                NativeModules.CastleNativeUtils.getConstants().nativeBuildVersion;
              headers['X-Build-Version-Name'] =
                NativeModules.CastleNativeUtils.getConstants().nativeAppVersion;
              headers['X-Scene-Creator-Version'] =
                NativeModules.CastleNativeUtils.getConstants().sceneCreatorApiVersion;
              if (Constants.iOS) {
                const installSource = NativeModules.CastleNativeUtils.getConstants().installSource;
                headers['X-Install-Source'] = installSource;
              }
              if (gAuthToken) {
                headers['X-Auth-Token'] = gAuthToken;
              }
              operation.setContext({ headers });
            })
            .then(() => {
              handle = forward(operation).subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
              });
            })
            .catch(observer.error.bind(observer));
          return () => {
            if (handle) handle.unsubscribe();
          };
        })
    ),
    createUploadLink({
      uri: 'https://api.castle.xyz/graphql',
    }),
  ]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // https://www.apollographql.com/docs/react/caching/advanced-topics/#cache-redirects-using-field-policy-read-functions
          card(_, { args, toReference }) {
            return toReference({
              __typename: 'Card',
              id: args.id,
            });
          },
        },
      },
      CommentsList: {
        keyFields: ['threadId'],
        fields: {
          comments: {
            // https://go.apollo.dev/c/merging-non-normalized-objects
            // always prefer incoming list of comments
            merge: false,
          },
        },
      },
      Card: {
        fields: {
          backgroundImage: {
            merge: (existing, incoming) => ({ ...existing, ...incoming }),
          },
        },
      },
    },
  }),
});

const userIdForUsernameAsync = async (username) => {
  const {
    data: {
      userForLoginInput: { userId },
    },
  } = await apolloClient.query({
    query: gql`
      query GetUserId($username: String!) {
        userForLoginInput(who: $username) {
          userId
        }
      }
    `,
    variables: { username },
  });
  return userId;
};

export const resetPasswordAsync = async ({ username }) => {
  const userId = await userIdForUsernameAsync(username);
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation ResetPassword($userId: ID!) {
        sendResetPasswordEmail(userId: $userId)
      }
    `,
    variables: { userId },
  });
  return result;
};

export const CARD_FRAGMENT = `
  id
  cardId
  sceneDataUrl
  title
  lastModified
  backgroundImage {
    url
    smallUrl
  }
  scene {
    data
    sceneId
  }
`;

const DECK_FRAGMENT = `
  id
  deckId
  title
  initialCard {
    id
    cardId
    sceneDataUrl
  }
  creator {
    userId
    username
    photo {
      url
    }
  }
  variables
  visibility
  accessPermissions
  commentsEnabled
`;

async function createNewDestinationCards(deckId, sceneData) {
  // if any 'send player to card' rule has a LocalId destination, save a blank card there
  let actors, data;
  try {
    if (deckId && sceneData) {
      data = JSON.parse(sceneData);
      actors = data.snapshot?.actors;
    }
  } catch (_) {}

  let cardsCreated = [];
  if (actors) {
    for (let ii = 0; ii < actors.length; ii++) {
      const actor = actors[ii];
      const components = actor?.bp?.components;
      if (components && components.Text && components.Rules && components.Rules.rules) {
        for (let jj = 0; jj < components.Rules.rules.length; jj++) {
          const rule = components.Rules.rules[jj];
          if (rule.trigger?.name === 'tap') {
            let response = rule.response;
            while (response && response.params) {
              if (response.name === 'send player to card') {
                const cardId = response.params.card?.cardId;
                if (cardId && LocalId.isLocalId(cardId)) {
                  const result = await apolloClient.mutate({
                    mutation: gql`
                      mutation UpdateDeckAndCard($deck: DeckInput!, $card: CardInput!) {
                        updateCardAndDeckV2(
                          deck: $deck,
                          card: $card,
                        ) {
                          card {
                            ${CARD_FRAGMENT}
                          }
                        }
                      }
                    `,
                    variables: {
                      deck: { deckId },
                      card: { cardId: cardId, blocks: [] },
                    },
                  });
                  const cardCreated = result.data.updateCardAndDeckV2.card;
                  cardsCreated.push(cardCreated);
                  LocalId.setIdIsSaved(cardId);
                }
              }
              response = response.params.nextResponse;
            }
          }
        }
      }
    }
  }
  return cardsCreated;
}

export const saveDeck = async (
  card,
  deck,
  variables,
  isAutosave = false,
  parentCardId = undefined
) => {
  const deckUpdateFragment = {
    deckId: parentCardId ? LocalId.makeId() : deck.deckId,
    title: deck.title,
  };
  const cardUpdateFragment = {
    cardId: parentCardId ? LocalId.makeId() : card.cardId,
    title: card.title,
    backgroundImageFileId: card.backgroundImage ? card.backgroundImage.fileId : undefined,
    sceneData: card.changedSceneData ? card.changedSceneData : card.scene?.data,
    blocks: [], // TODO: server requires this legacy field, would like to remove it
    makeInitialCard: card.makeInitialCard || undefined,
  };
  if (variables) {
    deckUpdateFragment.variables = variables;
  }

  const result = await apolloClient.mutate({
    mutation: gql`
        mutation UpdateDeckAndCard(
          $deck: DeckInput!, $card: CardInput!, $isAutosave: Boolean, $parentCardId: ID) {
          updateCardAndDeckV2(
            deck: $deck,
            card: $card,
            isAutosave: $isAutosave,
            parentCardId: $parentCardId,
          ) {
            deck {
              ${DECK_FRAGMENT}
            }
            card {
              ${CARD_FRAGMENT}
            }
          }
        }
      `,
    variables: { deck: deckUpdateFragment, card: cardUpdateFragment, isAutosave, parentCardId },
  });

  let updatedCard = result.data.updateCardAndDeckV2.card;
  let newCards = [...deck.cards];

  // NOTE: if parentCardId was provided, then deck id and card ids all changed.
  // we can get away with not updating the card ids here because when you clone a deck,
  // the app immediately navigates to the new deck overview and re-fetches everything.
  const updatedDeckId = parentCardId ? result.data.updateCardAndDeckV2.deck.deckId : deck.deckId;

  let existingIndex = deck.cards.findIndex((old) => old.cardId === card.cardId);
  if (existingIndex >= 0) {
    newCards[existingIndex] = updatedCard;
  } else {
    newCards.push(updatedCard);
  }

  // mark any local ids as nonlocal
  if (LocalId.isLocalId(updatedCard.cardId)) {
    LocalId.setIdIsSaved(updatedCard.cardId);
  }
  if (LocalId.isLocalId(updatedDeckId)) {
    LocalId.setIdIsSaved(updatedDeckId);
  }

  // create any destination cards marked as 'new' which are referenced by this card
  const cardsCreated = await createNewDestinationCards(updatedDeckId, card.changedSceneData);
  if (cardsCreated) {
    newCards = newCards.concat(cardsCreated);
  }

  return {
    card: updatedCard,
    deck: {
      ...result.data.updateCardAndDeckV2.deck,
      cards: newCards,
    },
  };
};

export const getDeckById = async (deckId) => {
  const result = await apolloClient.query({
    query: gql`
      query GetDeckById($deckId: ID!) {
        deck(deckId: $deckId) {
          ${DECK_FRAGMENT}
          cards {
            ${CARD_FRAGMENT}
          }
        }
      }
    `,
    variables: { deckId },
    fetchPolicy: 'no-cache',
  });
  return result.data.deck;
};

export const uploadFile = async ({ uri }) => {
  const name = uri.match(/[^/]*$/)[0] || '';
  const extension = name.match(/[^.]*$/)[0] || '';
  const result = await apolloClient.mutate({
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
  return result?.data?.uploadFile;
};

export const uploadDeckPreview = async ({ deckId, framePaths }) => {
  const files = framePaths.map((path) => {
    const name = path.match(/[^/]*$/)[0] || '';
    return new ReactNativeFile({
      uri: path,
      name,
      type: 'image/png',
    });
  });
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation UploadDeckPreview($deckId: ID!, $files: [Upload]!) {
        uploadDeckPreview(deckId: $deckId, files: $files) {
          fileId
          url
        }
      }
    `,
    variables: {
      deckId,
      files,
    },
    fetchPolicy: 'no-cache',
  });
  return result?.data?.uploadDeckPreview;
};

export const uploadAudioFile = async (filePath) => {
  const name = filePath.match(/[^/]*$/)[0] || '';
  const file = new ReactNativeFile({
    uri: filePath,
    name,
    type: 'audio/mpeg',
  });

  const result = await apolloClient.mutate({
    mutation: gql`
      mutation uploadAudioFile($file: Upload!) {
        uploadAudioFile(file: $file) {
          fileId
          url
        }
      }
    `,
    variables: {
      file,
    },
    fetchPolicy: 'no-cache',
  });
  return result?.data?.uploadAudioFile;
};

export const uploadBase64 = async (data) => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation UploadBase64($data: String!, $filename: String, $mimetype: String) {
        uploadBase64(data: $data, filename: $filename, mimetype: $mimetype) {
          fileId
          url
        }
      }
    `,
    variables: {
      data,
      filename: 'screenshot.png',
      mimetype: 'image/png',
    },
    fetchPolicy: 'no-cache',
  });
  return result?.data?.uploadBase64;
};

export const toggleFollowUser = async (userId, follow) => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation ($userId: ID!, $follow: Boolean!) {
        toggleFollowUser(userId: $userId, follow: $follow) {
          userId
          connections
        }
      }
    `,
    variables: { userId, follow },
  });
  return result?.data?.toggleFollowUser;
};

export const blockUser = async (userId, isBlocked) => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation ($userId: ID!, $isBlocked: Boolean!) {
        blockUser(userId: $userId, isBlocked: $isBlocked) {
          userId
          isBlocked
        }
      }
    `,
    variables: { userId, isBlocked },
  });
  return result?.data?.blockUser;
};

export const reportDeck = async (deckId) => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation ($deckId: ID!) {
        reportDeck(deckId: $deckId) {
          deckId
        }
      }
    `,
    variables: { deckId },
  });
  return result?.data?.reportDeck;
};

export const markPushNotificationClicked = async (pushNotificationId) => {
  await apolloClient.mutate({
    mutation: gql`
      mutation ($pushNotificationId: ID!) {
        markPushNotificationClicked(pushNotificationId: $pushNotificationId)
      }
    `,
    variables: { pushNotificationId },
  });
};

export const createShortLink = async (url) => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation ($url: String!) {
        createShortLink(url: $url) {
          url
        }
      }
    `,
    variables: { url },
  });
  return result?.data?.createShortLink.url;
};

export const resolveDeepLink = async (url) => {
  const result = await apolloClient.mutate({
    mutation: gql`
      query ($url: String!) {
        resolveDeepLink(url: $url) {
          resolvedUrl
          deck {
            deckId
          }
        }
      }
    `,
    variables: { url },
  });
  return result?.data?.resolveDeepLink;
};

const _sendMarkFollowingFeedRead = debounce(
  async () =>
    apolloClient.mutate({
      mutation: gql`
        mutation {
          markFollowingFeedRead
        }
      `,
    }),
  100
);

const _sendMarkNotificationsRead = debounce(
  async ({ notificationIds }) =>
    apolloClient.mutate({
      mutation: gql`
        mutation SetNotificationsStatus($notificationIds: [ID]!, $status: NotificationStatus!) {
          setNotificationsStatus(notificationIds: $notificationIds, status: $status)
        }
      `,
      variables: {
        notificationIds,
        status: 'seen',
      },
    }),
  100
);

export const setNotifBadge = (count) => {
  // Sets app badge on iOS + Android and in-app tab badge on Android
  PushNotifications.setBadgeCount(count);

  // Sets in-app tab badge on iOS
  EventEmitter.sendEvent('notifications', {
    notificationsBadgeCount: count,
  });
};

const NOTIF_FETCH_THRESHOLD_MS = 10 * 60 * 1000;
let notifLastFetchTime;

export const maybeFetchNotificationsAsync = async (force = true) => {
  if (!gAuthToken) {
    return false;
  }

  // This function is called frequently and can result in a lot of unnecessary reloading of the
  // notifs tab. Only refresh if we need to.
  if (!force && notifLastFetchTime && Date.now() - notifLastFetchTime < NOTIF_FETCH_THRESHOLD_MS) {
    return false;
  }

  notifLastFetchTime = Date.now();

  const result = await apolloClient.query({
    query: gql`
    query {
      notificationsV2(limit: 64) {
        isAdmin
        newFollowingDecks
        notifications {
          notificationId
          type
          status
          body
          userIds
          users {
            userId
            username
            connections
            photo {
              url
            }
          }
          deckId
          deck {
            ${Constants.FEED_ITEM_DECK_FRAGMENT}
          }
          updatedTime
        }
      }
    }
  `,
    fetchPolicy: 'no-cache',
  });
  const data = result?.data?.notificationsV2 ?? {};
  const { notifications, newFollowingDecks, isAdmin } = data;
  gIsAdmin = isAdmin;
  const notificationsBadgeCount = notifications
    ? notifications.reduce((accum, n) => accum + (n.status === 'unseen'), 0)
    : 0;
  PushNotifications.setNewFollowingDecks(newFollowingDecks);
  EventEmitter.sendEvent('notifications', {
    newFollowingDecks,
    notifications,
  });

  setNotifBadge(notificationsBadgeCount);
};

export const fetchMoreNotifications = async (oldNotifications) => {
  if (!oldNotifications || !oldNotifications.length) {
    return;
  }

  const result = await apolloClient.query({
    query: gql`
    query($beforeId: ID) {
      notificationsV2(limit: 64, beforeId: $beforeId) {
        isAdmin
        newFollowingDecks
        notifications {
          notificationId
          type
          status
          body
          userIds
          users {
            userId
            username
            connections
            photo {
              url
            }
          }
          deckId
          deck {
            ${Constants.FEED_ITEM_DECK_FRAGMENT}
          }
          updatedTime
        }
      }
    }
  `,
    fetchPolicy: 'no-cache',
    variables: { beforeId: oldNotifications[oldNotifications.length - 1].notificationId },
  });
  const data = result?.data?.notificationsV2 ?? {};
  const { notifications } = data;

  EventEmitter.sendEvent('notifications', {
    notifications: [...oldNotifications, ...notifications],
  });
};
