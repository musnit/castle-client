import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';

import ConfigureInput from './ConfigureInput';

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
});

const ConfigureDeck = (props) => {
  return (
    <View style={styles.container}>
      <ConfigureInput
        label="Name"
        placeholder="Choose a name for this deck"
        value={props.deck.title}
        onChangeText={(title) => props.onChange({ title })}
      />
      <TouchableOpacity style={styles.deleteButton}>
        <Text style={styles.deleteLabel}>Delete Deck</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ConfigureDeck;
