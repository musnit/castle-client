import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import FastImage from 'react-native-fast-image';

import CardDestinationPickerControl from './CardDestinationPickerControl';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 6,
    width: '100%',
    minHeight: 72,
    paddingBottom: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomColor: '#444',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  pickerRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  editDescriptionField: {
    minHeight: 22,
    width: '100%',
    flexShrink: 1,
    color: '#000',
    paddingTop: 4,
    paddingBottom: 4,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginVertical: 12,
  },
  selectContainer: {
    borderRadius: 3,
    borderWidth: 1,
    padding: 8,
    marginHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selection: { width: '100%', flexShrink: 1 },
  select: { marginLeft: 4, flexShrink: 0 },
  arrow: { marginLeft: 4, flexShrink: 0 },
});

const textTypeStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  row: {
    borderBottomColor: '#e0e0e0',
  },
  choiceRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  editDescriptionField: {
    color: '#000',
  },
  selectContainer: {
    borderColor: '#ccc',
  },
  selection: {
    color: '#000',
  },
  label: {
    color: '#666',
  },
});

const choiceTypeStyles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
  },
  row: {},
  choiceRow: {},
  editDescriptionField: {
    color: '#fff',
    fontWeight: '700',
  },
  selectContainer: {
    borderColor: '#2b2b2b',
  },
  selection: {
    color: '#fff',
  },
  label: {
    color: '#888',
  },
});

const EditBlock = (props) => {
  const { deck, blockToEdit: block, onChangeBlock } = props;

  const blockType = block.type.charAt(0).toUpperCase() + block.type.slice(1);
  const destination = block.createDestinationCard
    ? 'New Card'
    : block.destinationCardId
    ? deck.cards.find((card) => card.cardId === block.destinationCardId).title
    : null;
  const typeStyles = block.type === 'choice' ? choiceTypeStyles : textTypeStyles;
  const maybeBlockDestinationButton =
    block.type === 'choice' ? (
      <TouchableOpacity style={styles.arrow} onPress={props.onGoToDestination}>
        <FastImage
          style={{
            width: 22,
            aspectRatio: 1,
          }}
          source={require('../assets/images/arrow-circle-right.png')}
        />
      </TouchableOpacity>
    ) : null;
  return (
    <View style={[styles.container, typeStyles.container]}>
      <View style={[styles.row, typeStyles.row]}>
        <TextInput
          style={[styles.editDescriptionField, typeStyles.editDescriptionField]}
          multiline
          autoFocus
          numberOfLines={2}
          placeholder="Once upon a time..."
          placeholderTextColor="#999"
          onFocus={props.onTextInputFocus}
          value={block.title}
          onChangeText={(text) => onChangeBlock({ ...block, title: text })}
        />
        {maybeBlockDestinationButton}
      </View>
      <View style={[styles.row, typeStyles.row, typeStyles.choiceRow]}>
        <Text style={[styles.label, typeStyles.label]}>Choice</Text>
        <Switch
          value={block.type == 'choice'}
          onValueChange={(enabled) =>
            onChangeBlock({ ...block, type: enabled ? 'choice' : 'text' })
          }
        />
      </View>
      {block.type == 'choice' ? (
        <View style={styles.pickerRow}>
          <Text style={[styles.label, typeStyles.label, { paddingHorizontal: 12 }]}>
            Destination
          </Text>
          {destination ? (
            <TouchableOpacity
              style={[styles.selectContainer, typeStyles.selectContainer]}
              onPress={props.onSelectPickDestination}>
              <Text style={[styles.selection, typeStyles.selection]}>{destination}</Text>
            </TouchableOpacity>
          ) : (
            <CardDestinationPickerControl
              deck={deck}
              onSelectCard={(card) => props.onSelectDestination(block, card)}
              onSelectSearch={props.onSelectPickDestination}
            />
          )}
        </View>
      ) : null}
    </View>
  );
};

export default EditBlock;
