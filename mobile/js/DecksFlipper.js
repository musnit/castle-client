import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeArea, SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, TapGestureHandler, State } from 'react-native-gesture-handler';

import Viewport from './viewport';

import * as Constants from './Constants';

const { vw, vh } = Viewport;

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

const DUMMY_CARDS = [
  {
    color: '#00f',
    text: 'Card A',
  },
  {
    color: '#0f0',
    text: 'Card B',
  },
  {
    color: '#0ff',
    text: 'Card C',
  },
  {
    color: '#f00',
    text: 'Card D',
  },
  {
    color: '#f0f',
    text: 'Card E',
  },
  {
    color: '#ff0',
    text: 'Card F',
  },
];

const DecksFlipper = () => {
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
    if (currentCardIndex < DUMMY_CARDS.length - 1) {
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

  const card = DUMMY_CARDS[currentCardIndex];
  const prevCard = currentCardIndex > 0 ? DUMMY_CARDS[currentCardIndex - 1] : null;
  const nextCard =
    currentCardIndex < DUMMY_CARDS.length - 1 ? DUMMY_CARDS[currentCardIndex + 1] : null;

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: containerY }] }}>
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanStateChange}>
          <TapGestureHandler onHandlerStateChange={onTapPrevStateChange}>
            <Animated.View
              style={[
                styles.itemContainer,
                { backgroundColor: prevCard ? prevCard.color : '#000' },
              ]}>
              <View style={styles.itemCard}>
                <Text>{prevCard && prevCard.text}</Text>
              </View>
            </Animated.View>
          </TapGestureHandler>
        </PanGestureHandler>
        <View style={[styles.itemContainer, { backgroundColor: card.color }]}>
          <View style={styles.itemCard}>
            <Text>{card.text}</Text>
          </View>
        </View>
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanStateChange}>
          <TapGestureHandler onHandlerStateChange={onTapNextStateChange}>
            <Animated.View
              style={[
                styles.itemContainer,
                { backgroundColor: nextCard ? nextCard.color : '#000' },
              ]}>
              <View style={styles.itemCard}>
                <Text>{nextCard && nextCard.text}</Text>
              </View>
            </Animated.View>
          </TapGestureHandler>
        </PanGestureHandler>
      </Animated.View>
    </View>
  );
};

export default DecksFlipper;
