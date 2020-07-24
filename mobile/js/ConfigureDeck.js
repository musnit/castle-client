import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';

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

const ConfigureDeck = ({ deck, onChange, onDeleteDeck }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const maybeDeleteDeck = React.useCallback(() => {
    showActionSheetWithOptions(
      {
        title: 'Delete deck?',
        options: ['Delete Deck', 'Cancel'],
        destructiveButtonIndex: 0,
      },
      (index) => {
        if (index === 0) {
          onDeleteDeck();
        }
      }
    );
  }, [onDeleteDeck, showActionSheetWithOptions]);
  return (
    <View style={styles.container}>
      <ConfigureInput
        label="Name"
        placeholder="Choose a name for this deck"
        value={deck.title}
        onChangeText={(title) => onChange({ title })}
      />
      <TouchableOpacity style={styles.deleteButton} onPress={maybeDeleteDeck}>
        <Text style={styles.deleteLabel}>Delete Deck</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ConfigureDeck;
