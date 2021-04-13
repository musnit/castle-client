import * as React from 'react';
import { Pressable, StyleSheet, Text, FlatList, View } from 'react-native';
import { CardCell } from '../components/CardCell';
import { useNavigation } from '../ReactNavigation';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    color: Constants.colors.white,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  itemCard: {
    aspectRatio: Constants.CARD_RATIO,
    height: 160,
    width: null,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
});

export const ExploreRow = ({ feed }) => {
  const { navigate } = useNavigation();

  const onPressDeck = React.useCallback(
    (deck) => {
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
          onPress={() => onPressDeck(deck)}
          style={styles.itemCard}
        />
      ) : null;
    },
    [onPressDeck]
  );

  return (
    <View style={styles.container}>
      <Pressable onPress={onPressTitle}>
        <Text style={styles.title}>{feed.title}</Text>
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
