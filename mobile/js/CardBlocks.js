import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useGhostUI } from './ghost/GhostUI';
import { getPaneData } from './Tools';
import { sendAsync } from './ghost/GhostEvents';

import * as Constants from './Constants';

/**
 *  TODO: we can remove this component once we have migrated to text actors.
 */

const TEXT_ACTORS_PANE = 'sceneCreatorTextActors';

const styles = StyleSheet.create({
  choiceBlock: {
    backgroundColor: '#000',
    borderRadius: 6,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    ...Constants.styles.dropShadow,
  },
  choiceBlockDescription: {
    color: '#fff',
    fontWeight: '700',
    width: '100%',
    flexShrink: 1,
    marginRight: 8,
    fontSize: 16,
    lineHeight: 22,
  },
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

const TextActor = (props) => {
  const { actor } = props;
  if (actor.hasTapTrigger) {
    return (
      <TouchableOpacity
        style={[styles.choiceBlock, actor.isSelected ? styles.selected : null, props.style]}
        onPress={props.onSelect}>
        <Text style={styles.choiceBlockDescription}>{actor.content}</Text>
      </TouchableOpacity>
    );
  } else {
    return (
      <TouchableOpacity
        style={[styles.textBlock, actor.isSelected ? styles.selected : null, props.style]}
        onPress={props.onSelect}
        disabled={!props.isEditable}>
        <Text style={styles.textBlockDescription}>{actor.content}</Text>
      </TouchableOpacity>
    );
  }
};

export default TextActors = (props) => {
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
          .sort((a, b) => {
            if (a.hasTapTrigger !== b.hasTapTrigger) {
              return a.hasTapTrigger - b.hasTapTrigger;
            }
            return a.actor.drawOrder - b.actor.drawOrder;
          })
          .filter((actor) => actor.visible)
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
      {orderedActors.map((actor, ii) => {
        const { actorId } = actor.actor;
        const prevActorHasTrigger =
          ii > 0 ? orderedActors[ii - 1].hasTapTrigger : actor.hasTapTrigger;
        const styles = actor.hasTapTrigger !== prevActorHasTrigger ? { marginTop: 8 } : null;
        return (
          <TextActor
            key={`text-${actorId}`}
            actor={actor}
            style={styles}
            isEditable={props.isEditable}
            onSelect={() => selectActor(actorId)}
          />
        );
      })}
    </React.Fragment>
  );
};
