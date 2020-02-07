import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';

const MAX_NUM_CARDS = 4;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingLeft: 12,
  },
  cell: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 2,
    padding: 12,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: '#fff',
  },
  image: {
    width: 14,
    aspectRatio: 1,
    marginRight: 8,
  },
});

const CardPickerCell = ({ title, image, onPress }) => {
  return (
    <TouchableOpacity style={styles.cell} onPress={onPress}>
      {image ? <FastImage style={styles.image} source={image} /> : null}
      <Text style={styles.label}>{title}</Text>
    </TouchableOpacity>
  );
};

const CardDestinationPickerControl = ({ onSelectCard, onSelectSearch, deck }) => {
  let items = [];
  items.push({
    title: 'New',
    onPress: () => onSelectCard({ cardId: null }),
    image: require('../assets/images/add.png'),
  });
  items.push({
    title: 'Search',
    onPress: onSelectSearch,
    image: require('../assets/images/search.png'),
  });
  items = items.concat(
    deck.cards.slice(0, MAX_NUM_CARDS).map((card) => {
      return {
        title: card.title,
        onPress: () => onSelectCard(card),
      };
    })
  );
  return (
    <ScrollView horizontal>
      <View style={styles.container}>
        {items.map((item, ii) => (
          <CardPickerCell key={`card-${ii}`} {...item} />
        ))}
      </View>
    </ScrollView>
  );
};

export default CardDestinationPickerControl;
