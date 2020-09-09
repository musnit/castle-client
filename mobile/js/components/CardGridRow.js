import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CardCell } from '../components/CardCell';

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

export const CardGridRow = ({ decks, onPress }) => {
  const spacers = new Array(Math.max(0, 3 - decks.length)).fill(0);
  return (
    <View style={{ flexDirection: 'row' }}>
      {decks.map((deck, col) => (
        <CardCell
          key={`card-${deck.initialCard.cardId}`}
          style={[
            Constants.styles.gridItem,
            { flex: 1, marginLeft: col > 0 && Constants.iOS ? 8 : 0 },
          ]}
          card={deck.initialCard}
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
            { marginLeft: col + decks.length > 0 && Constants.iOS ? 8 : 0 },
          ]}
        />
      ))}
    </View>
  );
};
