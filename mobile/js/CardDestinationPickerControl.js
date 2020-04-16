import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicon from 'react-native-vector-icons/Ionicons';

const MAX_NUM_CARDS = 4;

import * as Constants from './Constants';
import * as Utilities from './utilities';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingLeft: 12,
  },
  cell: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginRight: 8,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 16,
  },
  icon: { marginRight: 4, marginTop: 1 },
});

const CardPickerCell = ({ title, icon, onPress }) => {
  return (
    <TouchableOpacity style={styles.cell} onPress={onPress}>
      {icon ? <Ionicon name={icon} size={18} color="#fff" style={styles.icon} /> : null}
      <Text style={styles.label}>{title}</Text>
    </TouchableOpacity>
  );
};

const CardDestinationPickerControl = ({ onSelectCard, onSelectSearch, deck }) => {
  let items = [];
  items.push({
    title: 'New',
    onPress: () => onSelectCard({ cardId: Constants.CREATE_NEW_CARD_ID }),
    icon: 'md-add',
  });
  items.push({
    title: 'Search',
    onPress: onSelectSearch,
    icon: 'md-search',
  });
  items = items.concat(
    deck.cards.slice(0, MAX_NUM_CARDS).map((card) => {
      return {
        title: Utilities.makeCardPreviewTitle(card),
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
