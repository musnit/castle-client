import React from 'react';
import gql from 'graphql-tag';
import { Animated, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeArea, SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, TapGestureHandler, State } from 'react-native-gesture-handler';
import { useLazyQuery } from '@apollo/react-hooks';
import { useFocusEffect } from '@react-navigation/native';

import CardCell from './CardCell';
import Viewport from './viewport';

import * as Constants from './Constants';

const { vw, vh } = Viewport;

const REFETCH_FEED_INTERVAL_MS = 30 * 1000;

const DECK_FEED_ITEM_MARGIN = 2;
const DECK_FEED_ITEM_HEIGHT =
  (1 / Constants.CARD_RATIO) * 100 * vw + // height of card
  DECK_FEED_ITEM_MARGIN; // margin below cell

const FLIP_MIN_TRANSLATE_Y = DECK_FEED_ITEM_HEIGHT * 0.35;
const FLIP_MIN_VELOCITY_Y = 72;

const SPRING_CONFIG = {
  tension: 150,
  friction: 50,
  overshootClamping: true,
  restDisplacementThreshold: 1,
  restSpeedThreshold: 1,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  itemContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: DECK_FEED_ITEM_MARGIN,
    borderRadius: 6,
  },
  itemCard: {
    aspectRatio: Constants.CARD_RATIO,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const DecksFlipper = () => {
  const [lastFetchedTime, setLastFetchedTime] = React.useState(null);
  const [fetchDecks, query] = useLazyQuery(
    gql`
      query {
        allDecks {
          id
          deckId
          title
          creator {
            userId
            username
          }
          initialCard {
            id
            cardId
            title
            backgroundImage {
              fileId
              url
              primaryColor
            }
            blocks {
              id
              cardBlockId
              cardBlockUpdateId
              type
              title
              destinationCardId
            }
          }
        }
      }
    `,
    { fetchPolicy: 'no-cache' }
  );

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Constants.Android && StatusBar.setTranslucent(true); // needed for tab navigator
      if (!lastFetchedTime || Date.now() - lastFetchedTime > REFETCH_FEED_INTERVAL_MS) {
        fetchDecks();
        setLastFetchedTime(Date.now());
      }
    }, [lastFetchedTime])
  );

  let decks;
  if (query.called && !query.loading && !query.error && query.data) {
    decks = query.data.allDecks;
  }

  const insets = useSafeArea();
  const tabBarHeight = 49;
  const centerContentY = Math.max(
    40,
    (100 * vh - insets.top - DECK_FEED_ITEM_HEIGHT - tabBarHeight) * 0.5
  );

  const [currentCardIndex, setCurrentCardIndex] = React.useState(1);

  let translateY = new Animated.Value(0);
  let containerY = Animated.add(translateY, centerContentY - DECK_FEED_ITEM_HEIGHT);
  const onPanGestureEvent = Animated.event([{ nativeEvent: { translationY: translateY } }]);

  const snapTo = (toValue, onFinished) => {
    Animated.spring(translateY, { toValue, ...SPRING_CONFIG }).start(({ finished }) => {
      if (finished) {
        translateY.setValue(0);
        onFinished && onFinished();
      }
    });
  };

  const snapToNext = () => {
    if (decks && currentCardIndex < decks.length - 1) {
      snapTo(-DECK_FEED_ITEM_HEIGHT, () => setCurrentCardIndex(currentCardIndex + 1));
    } else {
      snapTo(0);
    }
  };

  const snapToPrevious = () => {
    if (currentCardIndex > 0) {
      snapTo(DECK_FEED_ITEM_HEIGHT, () => setCurrentCardIndex(currentCardIndex - 1));
    } else {
      snapTo(0);
    }
  };

  const onPanStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY, velocityY } = event.nativeEvent;
      if (translationY < -FLIP_MIN_TRANSLATE_Y || velocityY < -FLIP_MIN_VELOCITY_Y) {
        snapToNext();
      } else if (translationY > FLIP_MIN_TRANSLATE_Y || velocityY > FLIP_MIN_VELOCITY_Y) {
        snapToPrevious();
      } else {
        snapTo(0);
      }
    }
  };

  const onTapPrevStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      snapToPrevious();
    }
  };

  const onTapNextStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      snapToNext();
    }
  };

  if (!decks) {
    // TODO: something
    return <View />;
  }

  const card = decks[currentCardIndex].initialCard;
  const prevCard = currentCardIndex > 0 ? decks[currentCardIndex - 1].initialCard : null;
  const nextCard =
    currentCardIndex < decks.length - 1 ? decks[currentCardIndex + 1].initialCard : null;

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: containerY }] }}>
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanStateChange}>
          <TapGestureHandler onHandlerStateChange={onTapPrevStateChange}>
            <Animated.View style={styles.itemContainer}>
              <View style={styles.itemCard}>{prevCard && <CardCell card={prevCard} />}</View>
            </Animated.View>
          </TapGestureHandler>
        </PanGestureHandler>
        <View style={styles.itemContainer}>
          <View style={styles.itemCard}>
            <CardCell card={card} />
          </View>
        </View>
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanStateChange}>
          <TapGestureHandler onHandlerStateChange={onTapNextStateChange}>
            <Animated.View style={styles.itemContainer}>
              <View style={styles.itemCard}>{nextCard && <CardCell card={nextCard} />}</View>
            </Animated.View>
          </TapGestureHandler>
        </PanGestureHandler>
      </Animated.View>
    </View>
  );
};

export default DecksFlipper;
