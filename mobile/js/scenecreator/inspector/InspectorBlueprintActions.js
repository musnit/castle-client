import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../Session';
import { useCardCreator } from '../CreateCardContext';
import { sendAsync } from '../../core/CoreEvents';

import * as Clipboard from '../LibraryEntryClipboard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 6,
  },
  actionButtonLabel: {
    fontSize: 14,
  },
});

// TODO: this component was derived from the old InspectorHeader,
// but the actions here should only apply to blueprints, not individual instances
export const InspectorBlueprintActions = () => {
  const { deck } = useCardCreator();

  // TODO: new engine data
  const data = { isBlueprint: true }; // previously `inspectorActions`
  const sendAction = (action, ...args) => sendAsync('EDITOR_INSPECTOR_ACTION', { action, ...args });

  const copyBlueprint = React.useCallback(() => {
    Clipboard.copySelectedBlueprint();
  }, []);

  const { userId: signedInUserId } = useSession();
  let canCopyBlueprint = false;

  // we could have Constants.EMPTY_DECK until data is fetched
  if (deck?.creator) {
    if (deck.accessPermissions == 'cloneable' || deck.creator.userId == signedInUserId) {
      canCopyBlueprint = true;
    }
  } else {
    canCopyBlueprint = true;
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.actionButton} onPress={() => sendAction('deleteSelection')}>
        <Text style={styles.actionButtonLabel}>Delete</Text>
      </Pressable>
      {data.isBlueprint && canCopyBlueprint ? (
        <Pressable style={styles.actionButton} onPress={() => copyBlueprint()}>
          <Text style={styles.actionButtonLabel}>Copy</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.actionButton} onPress={() => sendAction('duplicateSelection')}>
        <Text style={styles.actionButtonLabel}>Fork</Text>
      </Pressable>
    </View>
  );
};
