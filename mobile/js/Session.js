// Maintains session state for the API server connection -- auth token and GraphQL client
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { onError } from 'apollo-link-error';
import { ApolloLink, Observable } from 'apollo-link';
import { createUploadLink } from 'apollo-upload-client';
import { Image } from 'react-native';
import gql from 'graphql-tag';

let gAuthToken;

const EMPTY_SESSION = {
  authToken: null,
};

const SessionContext = React.createContext(EMPTY_SESSION);

export const Provider = (props) => {
  const [state, setState] = useState({ authToken: null, initialized: false });

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!state.initialized) {
        const authToken = await AsyncStorage.getItem('AUTH_TOKEN');
        gAuthToken = authToken;
        if (mounted) {
          setState({
            ...state,
            authToken,
            initialized: true,
          });
        }
      }
    })();

    return () => (mounted = false);
  }, []);

  const useNewAuthTokenAsync = async (newAuthToken) => {
    apolloClient.resetStore();
    if (newAuthToken) {
      await AsyncStorage.setItem('AUTH_TOKEN', newAuthToken);
    } else {
      await AsyncStorage.removeItem('AUTH_TOKEN');
    }
    gAuthToken = newAuthToken;
    return setState({
      ...state,
      authToken: newAuthToken,
    });
  };

  const signInAsync = async ({ username, password }) => {
    const userId = await userIdForUsernameAsync(username);
    const result = await apolloClient.mutate({
      mutation: gql`
        mutation SignIn($userId: ID!, $password: String!) {
          login(userId: $userId, password: $password) {
            userId
            token
          }
        }
      `,
      variables: { userId, password },
    });
    if (result && result.data && result.data.login && result.data.login.userId) {
      await useNewAuthTokenAsync(result.data.login.token);
    }
  };

  const signOutAsync = async () => {
    await apolloClient.mutate({
      mutation: gql`
        mutation SignOut {
          logout
        }
      `,
    });
    await useNewAuthTokenAsync(null);
  };

  const signUpAsync = async ({ username, name, email, password }) => {
    const result = await apolloClient.mutate({
      mutation: gql`
        mutation SignUp($name: String!, $username: String!, $email: String!, $password: String!) {
          signup(user: { name: $name, username: $username }, email: $email, password: $password) {
            userId
            token
          }
        }
      `,
      variables: { username, name, email, password },
    });
    if (result && result.data && result.data.signup && result.data.signup.userId) {
      await useNewAuthTokenAsync(result.data.signup.token);
    }
  };

  const value = {
    ...state,
    isSignedIn: state.authToken !== null,
    signInAsync,
    signOutAsync,
    signUpAsync,
  };
  return <SessionContext.Provider value={value}>{props.children}</SessionContext.Provider>;
};

export const useSession = () => React.useContext(SessionContext);

// for checking auth state outside of react component tree
export const isSignedIn = () => gAuthToken !== null;

// Based on https://www.apollographql.com/docs/react/migrating/boost-migration/
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) =>
          console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
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
      uri: 'https://api.castle.games/graphql',
    }),
  ]),
  cache: new InMemoryCache({
    cacheRedirects: {
      Query: {
        card: (_, args, { getCacheKey }) => getCacheKey({ __typename: 'Card', id: args.cardId }),
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

  await apolloClient.mutate({
    mutation: gql`
      mutation ResetPassword($userId: ID!) {
        sendResetPasswordEmail(userId: $userId)
      }
    `,
    variables: { userId },
  });
};

const CARD_FRAGMENT = `
  id
  cardId
  title
  backgroundImage {
    fileId
    url
  }
  scene {
    data
    sceneId
  }
  blocks {
    id
    cardBlockId
    cardBlockUpdateId
    type
    title
    destinationCardId
  }
`;

export const prefetchCardsAsync = async ({ cardId }) => {
  const {
    data: { prefetchCards },
  } = await apolloClient.query({
    query: gql`
      query PrefetchCards($cardId: ID!) {
        prefetchCards(cardId: $cardId) {
          ${CARD_FRAGMENT}
        }
      }
    `,
    variables: { cardId },
  });

  prefetchCards.forEach((card) => {
    if (card.backgroundImage && card.backgroundImage.url) {
      Image.prefetch(card.backgroundImage.url);
    }
  });
};

export const saveDeck = async (card, deck) => {
  const deckUpdateFragment = {
    title: deck.title,
  };
  const cardUpdateFragment = {
    title: card.title,
    backgroundImageFileId: card.backgroundImage ? card.backgroundImage.fileId : undefined,
    sceneId: card.scene ? card.scene.sceneId : undefined,
    blocks: card.blocks.map((block) => {
      return {
        type: block.type,
        destinationCardId: block.destinationCardId,
        title: block.title,
        createDestinationCard: block.createDestinationCard,
        cardBlockUpdateId: block.cardBlockUpdateId,
      };
    }),
    makeInitialCard: card.makeInitialCard || undefined,
  };
  if (deck.deckId && card.cardId) {
    // update existing card in deck
    const result = await apolloClient.mutate({
      mutation: gql`
        mutation UpdateCard($cardId: ID!, $card: CardInput!) {
          updateCard(
            cardId: $cardId,
            card: $card
          ) {
            ${CARD_FRAGMENT}
          }
        }
      `,
      variables: { cardId: card.cardId, card: cardUpdateFragment },
    });
    let updatedCard,
      newCards = [...deck.cards];
    result.data.updateCard.forEach((updated) => {
      let existingIndex = deck.cards.findIndex((old) => old.cardId === updated.cardId);
      if (existingIndex >= 0) {
        newCards[existingIndex] = updated;
      } else {
        newCards.push(updated);
      }
      if (updated.cardId === card.cardId) {
        updatedCard = updated;
      }
    });
    return {
      card: updatedCard,
      deck: {
        ...deck,
        cards: newCards,
      },
    };
  } else if (deck.deckId) {
    // add a card to an existing deck
    const result = await apolloClient.mutate({
      mutation: gql`
        mutation AddCard($deckId: ID!, $card: CardInput!) {
          addCard(deckId: $deckId, card: $card) {
            ${CARD_FRAGMENT}
          }
        }`,
      variables: { deckId: deck.deckId, card: cardUpdateFragment },
    });
    let newCards = deck.cards.concat(result.data.updateCard);
    return {
      card: newCards[newCards.length - 1],
      deck: {
        ...deck,
        cards: newCards,
      },
    };
  } else {
    // no existing deckId or cardId, so create a new deck
    // and add the card to it.
    const result = await apolloClient.mutate({
      mutation: gql`
        mutation CreateDeck($deck: DeckInput!, $card: CardInput!) {
          createDeck(
            deck: $deck,
            card: $card
          ) {
            id
            deckId
            title
            cards {
              ${CARD_FRAGMENT}
            }
            initialCard {
              id
              cardId
            }
          }
        }
      `,
      variables: { deck: deckUpdateFragment, card: cardUpdateFragment },
    });
    let newCard;
    if (result.data.createDeck.cards.length > 1) {
      // if the initial card contained references to other cards,
      // we can get many cards back here. we care about the non-empty one
      newCard = result.data.createDeck.cards.find((card) => card.blocks && card.blocks.length > 0);
    } else {
      newCard = result.data.createDeck.cards[0];
    }
    return {
      card: newCard,
      deck: result.data.createDeck,
    };
  }
};

export const getDeckById = async (deckId) => {
  const result = await apolloClient.query({
    query: gql`
      query GetDeckById($deckId: ID!) {
        deck(deckId: $deckId) {
          id
          deckId
          title
          cards {
            ${CARD_FRAGMENT}
          }
          initialCard {
            id
            cardId
          }
        }
      }
    `,
    variables: { deckId },
    fetchPolicy: 'no-cache',
  });
  return result.data.deck;
};
