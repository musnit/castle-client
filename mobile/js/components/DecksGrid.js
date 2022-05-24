import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { CardCell } from './CardCell';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';

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

const CardGridRow = React.memo(({ decks, onPress, DeckComponent }) => {
  const spacers = new Array(Math.max(0, 3 - decks.length)).fill(0);
  const Component = DeckComponent ?? CardCell;
  return (
    <View style={{ flexDirection: 'row', paddingLeft: Constants.GRID_PADDING }}>
      {decks.map((deck, col) => (
        <Component
          key={`card-${deck.initialCard.cardId}`}
          style={[Constants.styles.gridItem, { flex: 1 }]}
          deck={deck}
          card={deck.initialCard}
          visibility={deck.visibility}
          creator={deck.creator}
          onPress={() => onPress(deck, col)}
          inGrid={true}
        />
      ))}
      {spacers.map((_, col) => (
        <View key={`empty-cell-${col}`} style={[styles.emptyCell, Constants.styles.gridItem]} />
      ))}
    </View>
  );
});

export const DecksGrid = ({
  decks,
  onPressDeck,
  scrollViewRef,
  keyboardAware,
  DeckComponent,
  ...props
}) => {
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
      return (
        <CardGridRow
          decks={item}
          DeckComponent={DeckComponent}
          onPress={(deck, col) => onPressDeck(deck, row * 3 + col)}
        />
      );
    },
    [onPressDeck]
  );

  if (keyboardAware) {
    return (
      <KeyboardAwareFlatList
        ref={scrollViewRef}
        contentContainerStyle={props.contentContainerStyle}
        data={groupedDecks}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.length ? `row-${item[0].deckId}-${index}` : `row-${index}`
        }
        {...props}
      />
    );
  } else {
    return (
      <FlatList
        ref={scrollViewRef}
        contentContainerStyle={props.contentContainerStyle}
        data={groupedDecks}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.length ? `row-${item[0].deckId}-${index}` : `row-${index}`
        }
        {...props}
      />
    );
  }
};
