import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import Icon from 'react-native-vector-icons/MaterialIcons';
import uuid from 'uuid/v4';

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  backupContainer: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
    color: '#888',
  },
});

const DUMMY_BACKUPS = [
  {
    version: 420,
    isAutosave: true,
    createdTime: '2020-05-13 14:24:43.000',
  },
  {
    version: 421,
    isAutosave: true,
    createdTime: '2020-05-13 14:24:43.000',
  },
  {
    version: 422,
    isAutosave: true,
    createdTime: '2020-05-13 14:24:43.000',
  },
];

const SceneBackups = ({ onSelectBackup }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  let backups = DUMMY_BACKUPS;

  const maybeSelectBackup = React.useCallback(
    (index) =>
      showActionSheetWithOptions(
        {
          title: `Do you want to revert the card to this backup?`,
          options: ['Revert', 'Cancel'],
          cancelButtonIndex: 1,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            onSelectBackup(backups[index]);
          }
        }
      ),
    [backups, onSelectBackup]
  );

  return (
    <View style={styles.content}>
      <View style={styles.labels}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.label}>Restore</Text>
      </View>
      {backups &&
        backups.map((backup, ii) => (
          <View style={styles.backupContainer} key={`backup-${ii}-${backup.version}`}>
            <Text style={styles.backupLabel}>{backup.createdTime}</Text>
            <TouchableOpacity
              onPress={() => maybeSelectBackup(ii)}
              style={{ paddingHorizontal: 8 }}>
              <Icon name="restore" size={24} color="#999" />
            </TouchableOpacity>
          </View>
        ))}
    </View>
  );
};

export default SceneBackups;
