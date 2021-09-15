import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Text, View } from 'react-native';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  choiceBlock: {
    backgroundColor: '#000',
    borderRadius: 6,
    width: '100%',
    paddingTop: 7,
    paddingBottom: 8,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...Constants.styles.dropShadow,
  },
  choiceBlockDescription: {
    color: '#fff',
    width: '100%',
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 24,
  },
  textBlock: {
    backgroundColor: '#fff',
    borderRadius: 6,
    width: '100%',
    paddingTop: 7,
    paddingBottom: 8,
    paddingHorizontal: 14,
    marginBottom: 8,
    ...Constants.styles.dropShadow,
  },
  textBlockDescription: {
    color: '#000',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 24,
  },
  selected: {
    borderWidth: 1,
    borderColor: '#0f0',
  },
});

const TextActor = (props) => {
  const { actor, disabled } = props;
  if (actor.isGhost) {
    return null;
  } else if (actor.hasTapTrigger) {
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

export const CardText = (props) => {
  if (!props.visible) {
    return null;
  }
  const { textActors, disabled = false } = props;
  let orderedActors = [];

  if (textActors) {
    orderedActors = textActors
      .sort((a, b) => {
        if (a.order === b.order) {
          const contentA = a.content ?? '';
          const contentB = b.content ?? '';
          return contentA.localeCompare(contentB, 'en', { sensitivity: 'base' });
        }
        return a.order - b.order;
      })
      .filter((actor) => actor.visible || props.isEditable);
  }

  return (
    <React.Fragment>
      {orderedActors.map((actor, ii) => {
        const { actorId } = actor;
        return (
          <TextActor
            key={`text-${actorId}`}
            actor={actor}
            isEditable={props.isEditable}
            disabled={disabled}
            onSelect={() => props.onSelect(actorId)}
          />
        );
      })}
    </React.Fragment>
  );
};
