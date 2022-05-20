import React from 'react';
import { TouchableOpacity, StyleSheet, Switch, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { useActionSheet } from '@expo/react-native-action-sheet';

import * as Constants from '../Constants';
import { InspectorCheckbox } from '../scenecreator/inspector/components/InspectorCheckbox';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  deleteContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  deleteButton: {
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
    marginBottom: 8,
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
        <InspectorCheckbox
          value={deck.commentsEnabled === true}
          onChange={(value) => onChangeCommentsEnabled(value)}
          inverted
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Allow others to remix this deck</Text>
        <InspectorCheckbox
          value={deck.accessPermissions === 'cloneable'}
          onChange={(value) => onChangeAccessPermissions(value ? 'cloneable' : 'sourceReadable')}
          inverted
        />
      </View>
      <View style={styles.deleteContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={maybeDeleteDeck}>
          <Text style={styles.deleteLabel}>Delete this deck</Text>
        </TouchableOpacity>
      </View>
    </View>
  ) : (
    <View style={styles.container} />
  );
};
