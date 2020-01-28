import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';

const styles = StyleSheet.create({
  cards: {
    marginTop: 16,
    paddingLeft: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardContainer: {
    paddingBottom: 8,
    paddingRight: 8,
    width: '33%',
    height: 192, // TODO: correct ratio
  },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#f2f2f2',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const CardCell = ({ card, onPress }) => (
  <View style={styles.cardContainer}>
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text>{card.title}</Text>
    </TouchableOpacity>
  </View>
);

const CardsGrid = ({ deck }) => {
  const navigation = useNavigation();
  return (
    <View style={styles.cards}>
      {deck &&
        deck.cards.map((card) => (
          <CardCell
            key={card.cardId}
            card={card}
            onPress={() =>
              navigation.push('CreateCard', {
                deckIdToEdit: deck.deckId,
                cardIdToEdit: card.cardId,
              })
            }
          />
        ))}
    </View>
  );
};

export default CardsGrid;
