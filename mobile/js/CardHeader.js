import React, { Fragment } from 'react';
import { StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import * as Constants from './Constants';
import * as Utilities from './utilities';

import ConfigureInput from './ConfigureInput';
import Viewport from './viewport';

const styles = StyleSheet.create({
  container: {
    zIndex: 1, // we use negative margin to place the scene behind the header
  },
  drawer: {},
  cardTop: {
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  deleteButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#c00',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  deleteLabel: {
    color: '#f00',
  },
  configureRow: {
    marginTop: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configureLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
    color: '#888',
  },
});

const ConfigureCard = ({ card, onChange, onDeleteCard }) => {
  return (
    <View style={{ minHeight: 45 * Viewport.vh, padding: 16, marginTop: 42, marginBottom: 16 }}>
      <ConfigureInput
        label="Short Name"
        placeholder="Choose a name for this card"
        value={card.title}
        onChangeText={(title) => onChange({ title })}
      />
      {card.cardId && (
        <View style={styles.configureRow}>
          <Text style={styles.configureLabel}>Use as top card</Text>
          <Switch
            ios_backgroundColor="#444"
            value={!!card.makeInitialCard}
            onValueChange={(makeInitialCard) => onChange({ makeInitialCard })}
          />
        </View>
      )}
      {card.cardId && (
        <TouchableOpacity style={styles.deleteButton} onPress={onDeleteCard}>
          <Text style={styles.deleteLabel}>Delete Card</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const CardHeader = (props) => {
  const { card, expanded, isEditable } = props;
  const title = Utilities.makeCardPreviewTitle(card);
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <View style={styles.drawer}>
        {expanded ? (
          <ConfigureCard card={card} onChange={props.onChange} onDeleteCard={props.onDeleteCard} />
        ) : null}
        <View style={[styles.cardTop, { marginBottom: expanded ? 12 : -54 }]} />
      </View>
    </View>
  );
};

export default CardHeader;
