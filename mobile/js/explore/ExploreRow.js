import * as React from 'react';
import { StyleSheet, Text, FlatList, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
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
  },
  itemCard: {
    aspectRatio: Constants.CARD_RATIO,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
});

export const ExploreRow = ({ feed }) => {
  const { navigate } = useNavigation();

  const onPressDeck = (deck) => {
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
  };
  const renderItem = ({ item, index }) => {
    const deck = item;

    return (
      <TouchableOpacity onPress={() => onPressDeck(deck)} style={styles.itemCard}>
        {deck ? <CardCell card={deck.initialCard} creator={deck.creator} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{feed.title}</Text>
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
