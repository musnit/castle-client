import React from 'react';
import gql from 'graphql-tag';
import { Animated, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeArea, SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, TapGestureHandler, State } from 'react-native-gesture-handler';
import { useLazyQuery } from '@apollo/react-hooks';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';

import CardCell from './CardCell';
import { MainSwitcherContext } from './MainSwitcher';
import PlayDeckNavigator from './PlayDeckNavigator';
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
  },
  itemCard: {
    aspectRatio: Constants.CARD_RATIO,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  cardPlaceholder: {
    position: 'absolute',
    top: -DECK_FEED_ITEM_HEIGHT - DECK_FEED_ITEM_MARGIN,
    width: '100%',
    height: DECK_FEED_ITEM_HEIGHT,
    backgroundColor: '#ff0',
    backgroundColor: '#666',
    borderRadius: 6,
  },
});

// renders the current focused deck in the feed
// including the interactive scene.
const CurrentDeckCell = ({ deck }) => {
  const { mode: mainSwitcherMode } = React.useContext(MainSwitcherContext); // Dealing with legacy game loading path
  const isFocused = useIsFocused();

  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let timeout;
    let active = true;
    if (deck) {
      timeout = setTimeout(() => {
        active && mainSwitcherMode === 'navigator' && isFocused && setReady(true);
      }, 10);
    } else {
      active && setReady(false);
    }
    return () => {
      setReady(false);
      active = false;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [deck, mainSwitcherMode, isFocused]);

  return (
    <View style={styles.itemCard}>
      <CardCell card={deck.initialCard} />
      {ready ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
          }}>
          <PlayDeckNavigator
            deckId={deck.deckId}
            cardId={deck.initialCard && deck.initialCard.cardId}
          />
        </View>
      ) : null}
    </View>
  );
};

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

  const [currentCardIndex, setCurrentCardIndex] = React.useState(0);

  let translateY = new Animated.Value(0);
  let containerY = Animated.add(translateY, centerContentY - DECK_FEED_ITEM_HEIGHT);
  const onPanGestureEvent = Animated.event([{ nativeEvent: { translationY: translateY } }]);

  const snapTo = React.useCallback(
    (toValue, onFinished) => {
      Animated.spring(translateY, { toValue, ...SPRING_CONFIG }).start(({ finished }) => {
        if (finished) {
          translateY.setValue(0);
          onFinished && onFinished();
        }
      });
    },
    [translateY]
  );

  const snapToNext = React.useCallback(() => {
    if (decks && currentCardIndex < decks.length - 1) {
      snapTo(-DECK_FEED_ITEM_HEIGHT, () => setCurrentCardIndex(currentCardIndex + 1));
    } else {
      snapTo(0);
    }
  }, [decks?.length, currentCardIndex, snapTo]);

  const snapToPrevious = React.useCallback(() => {
    if (currentCardIndex > 0) {
      snapTo(DECK_FEED_ITEM_HEIGHT, () => setCurrentCardIndex(currentCardIndex - 1));
    } else {
      snapTo(0);
    }
  }, [decks?.length, currentCardIndex, snapTo]);

  const onPanStateChange = React.useCallback(
    (event) => {
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
    },
    [snapTo]
  );

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
    return <View style={styles.container} />;
  }

  const currentDeck = decks[currentCardIndex];
  const prevCard = currentCardIndex > 0 ? decks[currentCardIndex - 1].initialCard : null;
  const nextCard =
    currentCardIndex < decks.length - 1 ? decks[currentCardIndex + 1].initialCard : null;

  // the edge of the 'next-next' card is shown briefly during the snap animation
  // before the swap occurs.
  const nextNextCard =
    currentCardIndex < decks.length - 2 ? decks[currentCardIndex + 2].initialCard : null;

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: containerY }] }}>
        {currentCardIndex > 1 && <View style={styles.cardPlaceholder} />}
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
          <CurrentDeckCell deck={currentDeck} />
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
        {nextNextCard && (
          <View style={styles.itemContainer}>
            <View style={styles.itemCard}>
              <CardCell card={nextNextCard} />
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

export default DecksFlipper;
