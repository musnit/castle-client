import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Text, View } from 'react-native';

import * as Constants from './Constants';

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
  const { actor, disabled } = props;
  if (actor.hasTapTrigger) {
    return (
      <TouchableOpacity
        style={[
          styles.choiceBlock,
          actor.isSelected && props.isEditable ? styles.selected : null,
          props.style,
        ]}
        disabled={disabled}
        onPress={props.onSelect}>
        <Text style={styles.choiceBlockDescription}>{actor.content}</Text>
      </TouchableOpacity>
    );
  } else {
    return (
      <TouchableOpacity
        style={[
          styles.textBlock,
          actor.isSelected && props.isEditable ? styles.selected : null,
          props.style,
        ]}
        onPress={props.onSelect}
        disabled={!props.isEditable || disabled}>
        <Text style={styles.textBlockDescription}>{actor.content}</Text>
      </TouchableOpacity>
    );
  }
};

export default CardText = (props) => {
  if (!props.visible) {
    return null;
  }
  const { textActors, disabled = false } = props;
  let orderedActors = [];

  if (textActors) {
    orderedActors = Object.keys(textActors)
      .map((actorId) => textActors[actorId])
      .sort((a, b) => {
        if (a.order === b.order) {
          return a.content.localeCompare(b.content, 'en', { sensitivity: 'base' });
        }
        return a.order - b.order;
      })
      .filter((actor) => actor.visible);
  }

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
            disabled={disabled}
            onSelect={() => props.onSelect(actorId)}
          />
        );
      })}
    </React.Fragment>
  );
};
