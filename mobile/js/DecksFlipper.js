import React from 'react';
import gql from 'graphql-tag';
import {
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeArea, SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useLazyQuery } from '@apollo/react-hooks';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';

import CardCell from './CardCell';
import HomeOverlay from './HomeOverlay';
import { MainSwitcherContext } from './MainSwitcher';
import PlayDeckActions from './PlayDeckActions';
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
  useNativeDriver: true,
};

// large opaque views are too slow to animate on android, so use pre-baked
// dark images from the server instead
const USE_PRERENDERED_OVERLAY = Constants.Android;

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
  cardOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
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
      <PlayDeckActions deck={deck} />
    </View>
  );
};

const CardOverlay = ({ opacity }) => {
  return USE_PRERENDERED_OVERLAY ? null : (
    <Animated.View pointerEvents="none" style={[styles.cardOverlay, { opacity }]} />
  );
};

/**
 *  Cards other than the current card are faded to partial opacity
 */
const DARKENED_OVERLAY_OPACITY = 0.6;
const getCardOpacities = (translateY) => {
  const prev = translateY.interpolate({
    inputRange: [0, DECK_FEED_ITEM_HEIGHT],
    outputRange: [DARKENED_OVERLAY_OPACITY, 0],
  });
  const current = translateY.interpolate({
    inputRange: [-DECK_FEED_ITEM_HEIGHT, 0, DECK_FEED_ITEM_HEIGHT],
    outputRange: [DARKENED_OVERLAY_OPACITY, 0, DARKENED_OVERLAY_OPACITY],
  });
  const next = translateY.interpolate({
    inputRange: [-DECK_FEED_ITEM_HEIGHT, 0],
    outputRange: [0, DARKENED_OVERLAY_OPACITY],
  });
  return { prev, current, next };
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
            photo {
              url
            }
          }
          initialCard {
            id
            cardId
            title
            backgroundImage {
              url
              smallUrl
              overlayUrl
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

  const [currentCardIndex, setCurrentCardIndex] = React.useState(0);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content'); // needed for tab navigator
      Constants.Android && StatusBar.setTranslucent(true); // needed for tab navigator
      if (!lastFetchedTime || Date.now() - lastFetchedTime > REFETCH_FEED_INTERVAL_MS) {
        fetchDecks();
        setCurrentCardIndex(0);
        setLastFetchedTime(Date.now());
      }
    }, [lastFetchedTime])
  );

  let decks;
  if (query.called && !query.loading && !query.error && query.data) {
    decks = query.data.allDecks;
  }

  const insets = useSafeArea();
  let centerContentY = Math.max(
    insets.top + 64,
    (100 * vh - insets.top - insets.bottom - DECK_FEED_ITEM_HEIGHT) * 0.5
  );

  let translateY = new Animated.Value(0);
  let containerY = Animated.add(translateY, centerContentY - DECK_FEED_ITEM_HEIGHT);
  const onPanGestureEvent = Animated.event([{ nativeEvent: { translationY: translateY } }], {
    useNativeDriver: true,
  });

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

  const opacity = getCardOpacities(translateY);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: containerY }] }}>
        {currentCardIndex > 1 && <View style={styles.cardPlaceholder} />}
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanStateChange}>
          <Animated.View style={styles.itemContainer}>
            <TouchableWithoutFeedback onPress={snapToPrevious}>
              <View style={styles.itemCard}>
                {prevCard && <CardCell card={prevCard} useOverlay={USE_PRERENDERED_OVERLAY} />}
              </View>
            </TouchableWithoutFeedback>
            <CardOverlay opacity={opacity.prev} />
          </Animated.View>
        </PanGestureHandler>

        <View style={styles.itemContainer}>
          <CurrentDeckCell deck={currentDeck} />
          <CardOverlay opacity={opacity.current} />
        </View>
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanStateChange}>
          <Animated.View style={styles.itemContainer}>
            <TouchableWithoutFeedback onPress={snapToNext}>
              <View style={styles.itemCard}>
                {nextCard && <CardCell card={nextCard} useOverlay={USE_PRERENDERED_OVERLAY} />}
              </View>
            </TouchableWithoutFeedback>
            <CardOverlay opacity={opacity.next} />
          </Animated.View>
        </PanGestureHandler>
        {nextNextCard && (
          <View style={styles.itemContainer}>
            <View style={styles.itemCard}>
              <CardCell card={nextNextCard} useOverlay={USE_PRERENDERED_OVERLAY} />
              <CardOverlay opacity={DARKENED_OVERLAY_OPACITY} />
            </View>
          </View>
        )}
      </Animated.View>
      <HomeOverlay />
    </View>
  );
};

export default DecksFlipper;
