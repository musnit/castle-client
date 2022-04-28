import React from 'react';
import { TouchableOpacity, StyleSheet, Switch, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { useActionSheet } from '@expo/react-native-action-sheet';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    width: '100%',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  deleteLabel: {
    color: '#888',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  rowLabel: {
    color: Constants.colors.white,
    fontSize: 16,
  },
});

export const ConfigureDeck = ({
  deck,
  onDeleteDeck,
  onChangeAccessPermissions,
  onChangeCommentsEnabled,
}) => {
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
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Allow others to comment on this deck</Text>
        <Switch
          ios_backgroundColor="#888"
          value={deck.commentsEnabled === true}
          onValueChange={(value) => onChangeCommentsEnabled(value)}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Allow others to remix this deck</Text>
        <Switch
          ios_backgroundColor="#888"
          value={deck.accessPermissions === 'cloneable'}
          onValueChange={(value) =>
            onChangeAccessPermissions(value ? 'cloneable' : 'sourceReadable')
          }
        />
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={maybeDeleteDeck}>
        <Text style={styles.deleteLabel}>Delete this deck</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.container} />
  );
};
