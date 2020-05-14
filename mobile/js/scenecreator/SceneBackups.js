import React from 'react';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import Icon from 'react-native-vector-icons/MaterialIcons';
import uuid from 'uuid/v4';

import * as Constants from '../Constants';
import * as Session from '../Session';

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

let formatDate;

if (Constants.iOS) {
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  formatDate = (dateString) => {
    return dateFormatter.format(new Date(dateString));
  };
} else {
  formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
}

const getBackupData = async (cardId, version) => {
  const result = await Session.apolloClient.query({
    query: gql`
      query SceneBackup($cardId: ID!, $version: Int!) {
        sceneBackup(cardId: $cardId, version: $version) {
          data
        }
      }
    `,
    variables: { cardId, version },
  });
  if (result && result.data) {
    return result.data.sceneBackup.data;
  }
  return null;
};

const SceneBackups = ({ cardId, onSelectSceneData }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  let backups;

  const queryBackups = useQuery(
    gql`
      query CardBackups($cardId: ID!) {
        card(cardId: $cardId) {
          id
          sceneBackups {
            version
            isAutosave
            createdTime
          }
        }
      }
    `,
    { variables: { cardId }, fetchPolicy: 'no-cache' }
  );

  if (!queryBackups.loading && !queryBackups.error && queryBackups.data) {
    backups = queryBackups.data.card.sceneBackups;
  }

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
            const data = await getBackupData(cardId, backups[index].version);
            if (data) {
              onSelectSceneData(data);
            } else {
              console.warn(`Failed to fetch backup scene data`);
            }
          }
        }
      ),
    [backups, onSelectSceneData]
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
            <Text style={styles.backupLabel}>{formatDate(backup.createdTime)}</Text>
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
