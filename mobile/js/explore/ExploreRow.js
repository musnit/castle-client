import * as React from 'react';
import { Pressable, StyleSheet, Text, FlatList, View } from 'react-native';
import { Amplitude } from '@amplitude/react-native';
import { CardCell } from '../components/CardCell';
import { useNavigation } from '../ReactNavigation';
import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    color: Constants.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewAll: {
    color: Constants.colors.grayText,
    textTransform: 'uppercase',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  itemCard: {
    aspectRatio: Constants.CARD_RATIO,
    height: null,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  skeletonRowHeader: {
    backgroundColor: Constants.colors.skeletonText,
    height: 12,
    width: 100,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  skeletonCarousel: {
    flexDirection: 'row',
    marginLeft: 16,
  },
  skeletonCard: {
    aspectRatio: Constants.CARD_RATIO,
    borderRadius: Constants.CARD_BORDER_RADIUS,
    backgroundColor: Constants.colors.skeletonBG,
    width: 100,
    marginRight: 8,
  },
});

export const ExploreRow = ({ feed, last }) => {
  const { navigate } = useNavigation();

  const onPressDeck = React.useCallback(
    (deck, index) => {
      Amplitude.getInstance().logEvent('PLAY_EXPLORE_ROW_ITEM', {
        feedId: feed.feedId,
        deckId: deck.deckId,
        index,
      });
      navigate(
        'PlayDeck',
        {
          decks: [deck],
          initialDeckIndex: 0,
          title: feed.title,
        },
        {
          isFullscreen: true,
        }
      );
    },
    [navigate, feed]
  );

  const onPressTitle = React.useCallback(() => {
    navigate('ExploreFeed', {
      feedId: feed.feedId,
      title: feed.title,
    });
  }, [navigate, feed]);

  const renderItem = React.useCallback(
    ({ item, index }) => {
      const deck = item;

      return deck ? (
        <CardCell
          card={deck.initialCard}
          creator={deck.creator}
          onPress={() => onPressDeck(deck, index)}
          style={styles.itemCard}
          inGrid={true}
        />
      ) : null;
    },
    [onPressDeck]
  );

  return (
    <View style={[styles.container, last ? { borderBottomWidth: 0 } : null]}>
      <Pressable onPress={onPressTitle} style={styles.rowHeader}>
        <Text style={styles.title}>{feed.title}</Text>
        <Text style={styles.viewAll}>View All</Text>
      </Pressable>
      <FlatList
        data={feed.decks}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16 }}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?.deckId}
      />
    </View>
  );
};

export const SkeletonExploreRow = () => {
  return (
    <View style={styles.container}>
      <View style={styles.skeletonRowHeader} />
      <View style={styles.skeletonCarousel}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
    </View>
  );
};
