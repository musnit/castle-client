import * as React from 'react';
import { Pressable, StyleSheet, Text, FlatList, View } from 'react-native';
import { CardCell } from '../components/CardCell';
import { useNavigation } from '../ReactNavigation';
import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 16,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    color: Constants.colors.white,
    fontSize: 16,
  },
  itemCard: {
    aspectRatio: Constants.CARD_RATIO,
    height: null,
    width: 100,
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
          inGrid={true}
        />
      ) : null;
    },
    [onPressDeck]
  );

  return (
    <View style={styles.container}>
      <Pressable onPress={onPressTitle} style={styles.rowHeader}>
        <Text style={styles.title}>{feed.title}</Text>
        <Icon size={24} name="chevron-right" color="#fff" />
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
