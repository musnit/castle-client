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

const FLIP_MIN_TRANSLATE_Y = DECK_FEED_ITEM_HEIGHT * 0.4;
const FLIP_MIN_VELOCITY_Y = 72;

const SPRING_CONFIG = {
  tension: 150,
  friction: 50,
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
  const insets = useSafeArea();
  const tabBarHeight = 49;
  const centerContentY = Math.max(
    40,
    (100 * vh - insets.top - DECK_FEED_ITEM_HEIGHT - tabBarHeight) * 0.5
  );

  let translateY = new Animated.Value(0);
  let containerY = Animated.add(translateY, centerContentY - DECK_FEED_ITEM_HEIGHT);
  const onPanGestureEvent = Animated.event([{ nativeEvent: { translationY: translateY } }]);

  const snapTo = (toValue) => {
    Animated.spring(translateY, { toValue, ...SPRING_CONFIG }).start(({ finished }) => {
      translateY.setValue(0);
    });
  };

  const snapToNext = () => snapTo(-DECK_FEED_ITEM_HEIGHT);
  const snapToPrevious = () => snapTo(DECK_FEED_ITEM_HEIGHT);

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

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: containerY }] }}>
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanStateChange}>
          <TapGestureHandler onHandlerStateChange={onTapPrevStateChange}>
            <Animated.View style={[styles.itemContainer, { backgroundColor: '#f00' }]}>
              <View style={styles.itemCard}>
                <Text>Prev card</Text>
              </View>
            </Animated.View>
          </TapGestureHandler>
        </PanGestureHandler>
        <View style={[styles.itemContainer, { backgroundColor: '#0f0' }]}>
          <View style={styles.itemCard}>
            <Text>Content card</Text>
          </View>
        </View>
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanStateChange}>
          <TapGestureHandler onHandlerStateChange={onTapNextStateChange}>
            <Animated.View style={[styles.itemContainer, { backgroundColor: '#00f' }]}>
              <View style={styles.itemCard}>
                <Text>Next card</Text>
              </View>
            </Animated.View>
          </TapGestureHandler>
        </PanGestureHandler>
      </Animated.View>
    </View>
  );
};

export default DecksFlipper;
