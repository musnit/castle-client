import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useGhostUI } from './ghost/GhostUI';
import { getPaneData } from './Tools';
import { sendAsync } from './ghost/GhostEvents';

import LegacyCardBlocks from './CardBlocks';

import * as Constants from './Constants';

/**
 *  TODO: we can remove this component once we have migrated to text actors.
 */

const USE_TEXT_ACTORS = true;
const TEXT_ACTORS_PANE = 'sceneCreatorTextActors';

const styles = StyleSheet.create({
  textBlock: {
    backgroundColor: '#fff',
    borderRadius: 6,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    ...Constants.styles.dropShadow,
  },
  textBlockDescription: {
    color: '#000',
    fontSize: 16,
    lineHeight: 22,
  },
});

const TextActors = () => {
  const { root } = useGhostUI();

  let textActors;
  if (root && root.panes) {
    const data = getPaneData(root.panes[TEXT_ACTORS_PANE]);
    if (data) {
      textActors = data.textActors;
    }
  }

  const selectActor = React.useCallback(
    (actorId) => {
      sendAsync('SELECT_ACTOR', {
        actorId,
      });
    },
    [sendAsync]
  );

  return (
    <React.Fragment>
      {textActors &&
        Object.keys(textActors).map((actorId) => {
          const actor = textActors[actorId];
          return (
            <TouchableOpacity
              key={`text-${actorId}`}
              style={styles.textBlock}
              onPress={() => selectActor(actorId)}>
              <Text style={styles.textBlockDescription}>{actor.content}</Text>
            </TouchableOpacity>
          );
        })}
    </React.Fragment>
  );
};

export default (props) => {
  if (!USE_TEXT_ACTORS) {
    return <LegacyCardBlocks {...props} />;
  }
  return <TextActors />;
};
