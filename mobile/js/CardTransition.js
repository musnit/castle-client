import React from 'react';
import { Animated, InteractionManager, StyleSheet, View } from 'react-native';
import gql from 'graphql-tag';

import * as Session from './Session';

import FastImage from 'react-native-fast-image';

const TRANSITION_CONFIG = {
  duration: 300,
  isInteraction: true,
  useNativeDriver: true,
};

const styles = StyleSheet.create({
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

const getBackgroundImageUrl = async (deckId, cardId) => {
  let backgroundImageUrl = null;
  if (cardId) {
    const { data } = await Session.apolloClient.query({
      query: gql`
        query GetCardById($cardId: ID!) {
          card(cardId: $cardId) {
            id
            cardId
            backgroundImage {
              fileId
              url
            }
          }
        }
      `,
      variables: { cardId },
    });
    return data.card.backgroundImage.url;
  } else {
    const { data } = await Session.apolloClient.query({
      query: gql`
        query GetDeckById($deckId: ID!) {
          deck(deckId: $deckId) {
            initialCard {
              id
              cardId
              backgroundImage {
                fileId
                url
              }
            }
          }
        }
      `,
      variables: { deckId },
    });
    return data.deck.initialCard.backgroundImage.url;
  }
};

export default class CardTransition extends React.Component {
  _nextBackgroundImageUrl = null;
  state = {
    prevCard: {
      cardId: null,
      backgroundImageUrl: null,
    },
    transitioning: false,
    opacity: new Animated.Value(0),
  };

  componentDidMount = () => {
    this._update();
  };

  componentDidUpdate = (prevProps) => {
    this._update(prevProps);
  };

  _update = async (prevProps) => {
    const { deckId, cardId } = this.props;
    if (!prevProps || (deckId !== prevProps.deckId || cardId !== prevProps.cardId)) {
      this.setState(
        {
          prevCard: {
            cardId: prevProps ? prevProps.cardId : null,
            backgroundImageUrl: this._nextBackgroundImageUrl,
          },
          transitioning: prevProps && prevProps.cardId !== null,
        },
        this._maybeBeginTransition
      );
      (async () => {
        const backgroundImageUrl = await getBackgroundImageUrl(deckId, cardId);
        this._nextBackgroundImageUrl = backgroundImageUrl;
      })();
    }
  };

  _maybeBeginTransition = async () => {
    if (this.state.transitioning) {
      const { opacity } = this.state;
      opacity.setValue(1);
      Animated.timing(opacity, { toValue: 0, ...TRANSITION_CONFIG }).start(({ finished }) => {
        if (finished) {
          this.setState({ transitioning: false });
        }
      });
    }
  };

  render() {
    const { style, children } = this.props;
    const { prevCard, transitioning, opacity } = this.state;
    const inOpacity = Animated.subtract(1, opacity);
    return (
      <React.Fragment>
        <Animated.View style={{ flex: 1, opacity: inOpacity }}>{children}</Animated.View>
        {prevCard.backgroundImageUrl !== null && transitioning ? (
          <Animated.View pointerEvents="none" style={[style, { opacity }]}>
            <FastImage
              style={styles.backgroundImage}
              source={{ uri: prevCard.backgroundImageUrl }}
            />
          </Animated.View>
        ) : null}
      </React.Fragment>
    );
  }
}
