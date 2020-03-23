import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeArea, SafeAreaView } from 'react-native-safe-area-context';

import Viewport from './viewport';

import * as Constants from './Constants';

const { vw, vh } = Viewport;

const DECK_FEED_ITEM_MARGIN = 2;
const DECK_FEED_ITEM_HEIGHT =
  (1 / Constants.CARD_RATIO) * 100 * vw + // height of card
  DECK_FEED_ITEM_MARGIN; // margin below cell

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
    position: 'absolute',
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
  const centerContentY = (100 * vh - insets.top - DECK_FEED_ITEM_HEIGHT - tabBarHeight) * 0.4;

  let contentY = new Animated.Value(centerContentY);
  let prevContentY = Animated.add(contentY, -DECK_FEED_ITEM_HEIGHT);
  let nextContentY = Animated.add(contentY, DECK_FEED_ITEM_HEIGHT);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.itemContainer, { backgroundColor: '#f00', top: prevContentY }]}>
        <View style={styles.itemCard}>
          <Text>Prev card</Text>
        </View>
      </Animated.View>
      <Animated.View style={[styles.itemContainer, { backgroundColor: '#0f0', top: contentY }]}>
        <View style={styles.itemCard}>
          <Text>Content card</Text>
        </View>
      </Animated.View>
      <Animated.View style={[styles.itemContainer, { backgroundColor: '#00f', top: nextContentY }]}>
        <View style={styles.itemCard}>
          <Text>Next card</Text>
        </View>
      </Animated.View>
    </View>
  );
};

export default DecksFlipper;
