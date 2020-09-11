import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { CardCell } from './CardCell';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  emptyCell: {
    width: '100%',
    flex: 1,
    borderRadius: Constants.CARD_SMALL_BORDER_RADIUS,
    backgroundColor: 'transparent',
    aspectRatio: Constants.CARD_RATIO,
  },
});

const CardGridRow = React.memo(({ decks, onPress }) => {
  const spacers = new Array(Math.max(0, 3 - decks.length)).fill(0);
  return (
    <View style={{ flexDirection: 'row' }}>
      {decks.map((deck, col) => (
        <CardCell
          key={`card-${deck.initialCard.cardId}`}
          style={[Constants.styles.gridItem, { flex: 1, marginLeft: col > 0 ? 8 : 0 }]}
          card={deck.initialCard}
          isPrivate={deck.isVisible === false}
          imageUrl={deck.creator.photo.url}
          onPress={() => onPress(deck, col)}
        />
      ))}
      {spacers.map((_, col) => (
        <View
          key={`empty-cell-${col}`}
          style={[
            styles.emptyCell,
            Constants.styles.gridItem,
            { marginLeft: col + decks.length > 0 ? 8 : 0 },
          ]}
        />
      ))}
    </View>
  );
});

export const DecksGrid = ({ decks, onPressDeck, scrollViewRef, ...props }) => {
  const [groupedDecks, setGroupedDecks] = React.useState([]);
  React.useEffect(() => {
    const newGroupedDecks = decks
      ? decks.reduce((grouped, deck, index) => {
          if (index % 3 == 0) {
            grouped.push([deck]);
          } else {
            grouped[grouped.length - 1].push(deck);
          }
          return grouped;
        }, [])
      : [];
    setGroupedDecks(newGroupedDecks);
  }, [decks]);

  const renderItem = React.useCallback(
    ({ item, index }) => {
      let row = index;
      return <CardGridRow decks={item} onPress={(deck, col) => onPressDeck(deck, row * 3 + col)} />;
    },
    [onPressDeck]
  );

  return (
    <FlatList
      ref={scrollViewRef}
      contentContainerStyle={{ paddingTop: 16 }}
      data={groupedDecks}
      renderItem={renderItem}
      keyExtractor={(item, index) =>
        item.length ? `row-${item[0].deckId}-${index}` : `row-${index}`
      }
      {...props}
    />
  );
};
