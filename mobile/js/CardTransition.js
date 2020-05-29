import React from 'react';
import { Animated, Easing, InteractionManager, Platform, StyleSheet, View } from 'react-native';
import gql from 'graphql-tag';

import * as Constants from './Constants';
import * as Session from './Session';

import FastImage from 'react-native-fast-image';
import PlayCardScreen from './PlayCardScreen';

const TRANSITION_CONFIG = {
  duration: 250,
  easing: Easing.out(Easing.ease),
  isInteraction: true,
  useNativeDriver: true,
};

const styles = StyleSheet.create({
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  nextCard: {
    borderRadius: Constants.CARD_BORDER_RADIUS,
    overflow: 'hidden',
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

const _makeCardProps = (props) => {
  const cardProps = { ...props };
  delete cardProps.style;
  return cardProps;
};

class CardTransition extends React.Component {
  state = {
    currentCardProps: _makeCardProps(this.props),
    nextCard: {
      cardId: null,
      backgroundImageUrl: null,
    },
    transitioning: false,
    transition: new Animated.Value(0),
  };

  componentDidMount = () => {
    this._update();
  };

  componentDidUpdate = (prevProps) => {
    this._update(prevProps);
  };

  _update = async (prevProps) => {
    const { deckId, cardId, counter } = this.props;
    if (
      !prevProps ||
      (deckId !== prevProps.deckId || cardId !== prevProps.cardId || counter !== prevProps.counter)
    ) {
      this.setState(
        {
          nextCard: {
            cardId,
            backgroundImageUrl: null,
          },
          transitioning: prevProps && prevProps.cardId !== null,
        },
        this._maybeBeginTransition
      );
    }
  };

  _maybeBeginTransition = async () => {
    if (this.state.transitioning) {
      (async () => {
        const backgroundImageUrl = await getBackgroundImageUrl(
          this.props.deckId,
          this.props.cardId
        );
        this.setState((state) => {
          return {
            ...state,
            nextCard: {
              ...state.nextCard,
              backgroundImageUrl,
            },
          };
        });
      })();

      const { transition } = this.state;
      Animated.timing(transition, { toValue: 1, ...TRANSITION_CONFIG }).start(({ finished }) => {
        if (finished) {
          this.setState({
            transitioning: false,
            currentCardProps: _makeCardProps(this.props),
          });
          transition.setValue(0);
        }
      });
    } else {
      // if not transitioning, immediately adopt next card
      this.setState({
        currentCardProps: _makeCardProps(this.props),
      });
    }
  };

  render() {
    const { currentCardProps, nextCard, transitioning, transition } = this.state;
    const inOpacity = transition;
    const inScale = transition.interpolate({
      inputRange: [0, 1],
      outputRange: [0.95, 1],
    });
    const outOpacity = Animated.subtract(1, transition);
    const outScale = transition.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.05],
    });
    return (
      <React.Fragment>
        {nextCard.backgroundImageUrl !== null && transitioning ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.nextCard, { opacity: inOpacity, transform: [{ scale: inScale }] }]}>
            <FastImage
              key={`image-${nextCard.cardId}`}
              style={styles.backgroundImage}
              source={{ uri: nextCard.backgroundImageUrl }}
            />
          </Animated.View>
        ) : null}
        <Animated.View style={{ flex: 1, opacity: outOpacity, transform: [{ scale: outScale }] }}>
          <PlayCardScreen
            key={`card-${currentCardProps.cardId}-${currentCardProps.counter}`}
            {...currentCardProps}
          />
        </Animated.View>
      </React.Fragment>
    );
  }
}

export default Platform.select({
  ios: CardTransition,
  android: PlayCardScreen,
});
