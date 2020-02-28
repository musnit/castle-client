import React from 'react';
import { View, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FastImage from 'react-native-fast-image';

import CardCell from './CardCell';
import SegmentedNavigation from './SegmentedNavigation';

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderColor: '#888',
  },
  navigationRow: {
    width: '100%',
    height: 54,
    flexDirection: 'row',
  },
  back: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: 8,
    paddingBottom: 16,
    flexDirection: 'row',
  },
  title: {
    color: '#fff',
    fontSize: 32,
  },
  topCardPreview: {
    maxWidth: '25%',
    flexShrink: 0,
    marginRight: 16,
  },
  instructions: {
    width: '100%',
    flexShrink: 1,
    alignItems: 'flex-start',
  },
  instructionsLabel: {
    color: '#fff',
    marginBottom: 12,
    fontSize: 16,
  },
  setVisibleButton: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
  },
  setVisibleLabel: {
    fontWeight: '700',
    color: '#000',
  },
});

const MODE_ITEMS = [
  {
    name: 'Cards',
    value: 'cards',
  },
  {
    name: 'Settings',
    value: 'settings',
  },
];

const DeckVisibleControl = ({ deck, onToggleVisible }) => {
  if (!deck) return null;
  const initialCard = deck.cards.find((c) => c.cardId === deck.initialCard.cardId);
  if (!initialCard) return null;

  const cardLabel = deck.cards.length > 1 ? 'The top card on this deck' : 'This card';

  return (
    <React.Fragment>
      <View style={styles.topCardPreview}>
        <CardCell card={initialCard} isPrivate={!deck.isVisible} />
      </View>
      <View style={styles.instructions}>
        {deck.isVisible ? (
          <React.Fragment>
            <Text style={styles.instructionsLabel}>
              {cardLabel} is <Text style={{ fontWeight: '700' }}>face up</Text>, meaning it's
              visible to others.
            </Text>
            <Text style={styles.instructionsLabel}>Flip it over to make it private.</Text>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Text style={styles.instructionsLabel}>
              {cardLabel} is <Text style={{ fontWeight: '700' }}>face down</Text>, meaning only you
              can view it.
            </Text>
            <Text style={styles.instructionsLabel}>Flip it over to make it public.</Text>
          </React.Fragment>
        )}
        <TouchableOpacity style={styles.setVisibleButton} onPress={onToggleVisible}>
          <Text style={styles.setVisibleLabel}>Flip Over</Text>
        </TouchableOpacity>
      </View>
    </React.Fragment>
  );
};

const DeckHeader = (props) => {
  const { deck } = props;
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navigationRow}>
        <TouchableOpacity style={styles.back} onPress={props.onPressBack}>
          <Icon name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <DeckVisibleControl
          deck={deck}
          onToggleVisible={() => props.onChangeDeck({ isVisible: !deck.isVisible })}
        />
      </View>
      <SegmentedNavigation
        items={MODE_ITEMS}
        selectedItem={MODE_ITEMS.find((item) => item.value === props.mode)}
        onSelectItem={(item) => props.onChangeMode(item.value)}
      />
    </View>
  );
};

export default DeckHeader;
