import React from 'react';
import { View, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { CardCell } from './components/CardCell';
import { SegmentedNavigation } from './components/SegmentedNavigation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FastImage from 'react-native-fast-image';

import * as Constants from './Constants';

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderColor: Constants.colors.grayOnBlackBorder,
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
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  topCardPreview: {
    maxWidth: '20%',
    marginRight: 24,
  },
  instructions: {
    paddingTop: 16,
    alignItems: 'flex-start',
  },
  instructionsLabel: {
    color: '#fff',
    marginBottom: 16,
    fontSize: 16,
    lineHeight: 24,
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

  return (
    <React.Fragment>
      <View style={styles.topCardPreview}>
        <CardCell card={initialCard} isPrivate={!deck.isVisible} />
      </View>
      <View style={styles.instructions}>
        {deck.isVisible ? (
          <React.Fragment>
            <Text style={styles.instructionsLabel}>
              This deck is <Text style={{ fontWeight: '700' }}>public</Text>.
            </Text>
            <TouchableOpacity style={Constants.styles.primaryButton} onPress={onToggleVisible}>
              <Text style={Constants.styles.primaryButtonLabel}>Make Private</Text>
            </TouchableOpacity>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Text style={styles.instructionsLabel}>
              This deck is <Text style={{ fontWeight: '700' }}>private</Text>.
            </Text>
            <TouchableOpacity style={Constants.styles.primaryButton} onPress={onToggleVisible}>
              <Text style={Constants.styles.primaryButtonLabel}>Make Public</Text>
            </TouchableOpacity>
          </React.Fragment>
        )}
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
