import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';

import CardCell from './CardCell';

const styles = StyleSheet.create({
  cards: {
    marginTop: 16,
    paddingLeft: 8,
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardContainer: {
    paddingBottom: 8,
    paddingRight: 8,
    width: '33%',
    height: 192, // TODO: correct ratio
  },
});

const CardsGrid = ({ deck }) => {
  const navigation = useNavigation();
  return (
    <View style={styles.cards}>
      {deck &&
        deck.cards.map((card) => (
          <View style={styles.cardContainer} key={card.cardId}>
            <CardCell
              card={card}
              onPress={() =>
                navigation.navigate('CreateCard', {
                  deckIdToEdit: deck.deckId,
                  cardIdToEdit: card.cardId,
                })
              }
            />
          </View>
        ))}
    </View>
  );
};

export default CardsGrid;
