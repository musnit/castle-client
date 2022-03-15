import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../../components/AppText';
import { useSession } from '../../Session';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useCardCreator } from '../CreateCardContext';
import { useCoreState, sendAsync } from '../../core/CoreEvents';

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
  actionButtonPressed: {
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
});

export const InspectorBlueprintActions = () => {
  const { deck } = useCardCreator();
  const { showActionSheetWithOptions } = useActionSheet();

  const selectedActorData = useCoreState('EDITOR_SELECTED_ACTOR');
  const libraryEntry = selectedActorData?.libraryEntry || { numActorsWithEntry: 0 };
  const sendAction = (action, ...args) => sendAsync('EDITOR_INSPECTOR_ACTION', { action, ...args });

  const copyBlueprint = React.useCallback(() => sendAsync('COPY_SELECTED_BLUEPRINT'), []);

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

  const maybeDeleteBlueprint = React.useCallback(() => {
    if (libraryEntry.numActorsWithEntry > 0) {
      // blueprint has instances in scene, prompt before deleting
      showActionSheetWithOptions(
        {
          title: `Delete this blueprint and ${libraryEntry.numActorsWithEntry} instance${
            libraryEntry.numActorsWithEntry === 1 ? '' : 's'
          } in the scene?`,
          options: ['Delete blueprint and instances', 'Cancel'],
          cancelButtonIndex: 1,
          destructiveButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            sendAction('deleteSelection');
          }
        }
      );
    } else {
      // no instances in scene, just delete blueprint
      sendAction('deleteSelection');
    }
  }, [showActionSheetWithOptions, libraryEntry, sendAction]);

  return (
    <View style={styles.container}>
      <Pressable style={styles.actionButton} onPress={maybeDeleteBlueprint}>
        <Text style={styles.actionButtonLabel}>Delete</Text>
      </Pressable>
      {canCopyBlueprint ? (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed ? styles.actionButtonPressed : null,
          ]}
          onPress={() => copyBlueprint()}>
          <Text style={styles.actionButtonLabel}>Copy</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.actionButton} onPress={() => sendAction('duplicateSelection')}>
        <Text style={styles.actionButtonLabel}>Fork</Text>
      </Pressable>
    </View>
  );
};
