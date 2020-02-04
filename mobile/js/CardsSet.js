import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import CardCell from './CardCell';

const styles = StyleSheet.create({
  gridContainer: {
    marginTop: 16,
    paddingLeft: 8,
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellContainer: {
    paddingBottom: 8,
    paddingRight: 8,
    width: '33%',
    height: 192, // TODO: correct ratio
  },
  listContainer: {},
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#888',
    padding: 16,
  },
  cardTitle: {
    color: '#fff',
  },
});

const CardListItem = ({ card, onPress }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress}>
    <Text style={styles.cardTitle}>{card.title}</Text>
  </TouchableOpacity>
);

const CardsList = ({ deck, onPress }) => {
  return (
    <View style={styles.listContainer}>
      {deck &&
        deck.cards.map((card) => (
          <CardListItem key={card.cardId} card={card} onPress={() => onPress(card)} />
        ))}
    </View>
  );
};

const CardsGrid = ({ deck, onPress }) => {
  return (
    <View style={styles.gridContainer}>
      {deck &&
        deck.cards.map((card) => (
          <View style={styles.cellContainer} key={card.cardId}>
            <CardCell card={card} onPress={() => onPress(card)} />
          </View>
        ))}
    </View>
  );
};

const CardsSet = (props) => {
  const [mode, setMode] = React.useState('grid');
  if (mode === 'grid') {
    return <CardsGrid {...props} />;
  } else {
    return <CardsList {...props} />;
  }
};

export default CardsSet;
