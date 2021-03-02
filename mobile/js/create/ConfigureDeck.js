import React from 'react';
import { TouchableOpacity, StyleSheet, Switch, Text, View } from 'react-native';
import { ConfigureInput } from '../components/ConfigureInput';
import { useActionSheet } from '@expo/react-native-action-sheet';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: '100%',
    maxWidth: Constants.TABLET_MAX_FORM_WIDTH,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  rowLabel: {
    fontSize: 16,
  },
});

export const ConfigureDeck = ({ deck, onChange, onDeleteDeck, onChangeAccessPermissions }) => {
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
  return deck ? (
    <View style={styles.container}>
      <ConfigureInput
        label="Name"
        placeholder="Choose a name for this deck"
        value={deck.title}
        onChangeText={(title) => onChange({ title })}
      />
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Allow others to save a copy</Text>
        <Switch
          ios_backgroundColor="#888"
          value={deck.accessPermissions === 'cloneable'}
          onValueChange={(value) =>
            onChangeAccessPermissions(value ? 'cloneable' : 'sourceReadable')
          }
        />
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={maybeDeleteDeck}>
        <Text style={styles.deleteLabel}>Delete Deck</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.container} />
  );
};
