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
  selected: {
    borderWidth: 1,
    borderColor: '#0f0',
  },
});

const TextActors = () => {
  const { root } = useGhostUI();
  const [orderedActors, setOrderedActors] = React.useState([]);

  let textActors;
  if (root && root.panes) {
    const data = getPaneData(root.panes[TEXT_ACTORS_PANE]);
    if (data) {
      textActors = data.textActors;
    }
  }

  React.useEffect(() => {
    if (textActors) {
      setOrderedActors(
        Object.keys(textActors)
          .map((actorId) => textActors[actorId])
          .sort((a, b) => a.actor.drawOrder - b.actor.drawOrder)
      );
    } else {
      setOrderedActors([]);
    }
  }, [textActors]);

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
      {orderedActors.map((actor) => {
        const { actorId } = actor.actor;
        return (
          <TouchableOpacity
            key={`text-${actorId}`}
            style={[styles.textBlock, actor.isSelected ? styles.selected : null]}
            onPress={() => selectActor(actorId)}>
            <Text style={styles.textBlockDescription}>{actor.content}</Text>
          </TouchableOpacity>
        );
      })}
    </React.Fragment>
  );
};

export default (props) => {
  if (!Constants.USE_TEXT_ACTORS) {
    return <LegacyCardBlocks {...props} />;
  }
  return <TextActors />;
};
