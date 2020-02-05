import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Text, TextInput, View } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  editDescriptionContainer: {
    backgroundColor: '#fff',
    borderRadius: 6,
    width: '100%',
    minHeight: 72,
    paddingHorizontal: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 1,
  },
  editDescriptionRow: {
    flexDirection: 'row',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  editDescriptionField: {
    minHeight: 22,
    width: '100%',
    flexShrink: 1,
    color: '#000',
    paddingTop: 12,
    paddingBottom: 8,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
  },
  selectContainer: {
    borderRadius: 3,
    borderWidth: 1,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selection: { width: '100%', flexShrink: 1 },
  select: { marginLeft: 4, flexShrink: 0 },
  arrow: { marginLeft: 4, flexShrink: 0 },
});

const textTypeStyles = StyleSheet.create({
  editDescriptionContainer: {
    backgroundColor: '#fff',
  },
  editDescriptionRow: {},
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
  editDescriptionContainer: {
    backgroundColor: '#000',
  },
  editDescriptionRow: {},
  editDescriptionField: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6,
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

const BLOCK_TYPES = [
  {
    name: 'Text',
    type: 'text',
  },
  {
    name: 'Choice',
    type: 'choice',
  },
];

const Dropdown = (props) => {
  const { onPress, styleSheet, value } = props;
  const valueToDisplay = value !== null ? value : '';
  return (
    <TouchableOpacity
      style={[styles.selectContainer, styleSheet.selectContainer]}
      onPress={onPress}>
      <Text style={[styles.selection, styleSheet.selection]}>{valueToDisplay}</Text>
      <View style={styles.select}>
        <FastImage
          style={{
            width: 16,
            aspectRatio: 1,
          }}
          source={require('../assets/images/arrow-button-down.png')}
        />
      </View>
    </TouchableOpacity>
  );
};

const DestinationPicker = (props) => {
  const { onPress, onPressArrow, styleSheet, value } = props;
  const valueToDisplay = value !== null ? value : '';
  return (
    <TouchableOpacity
      style={[styles.selectContainer, styleSheet.selectContainer]}
      onPress={onPress}>
      <Text style={[styles.selection, styleSheet.selection]}>{valueToDisplay}</Text>
    </TouchableOpacity>
  );
};

const EditBlock = (props) => {
  const { deck, block, onChangeBlock } = props;
  const { showActionSheetWithOptions } = useActionSheet();

  const selectBlockType = () =>
    showActionSheetWithOptions(
      {
        title: 'Block Type',
        options: BLOCK_TYPES.map((type) => type.name).concat(['Cancel']),
        cancelButtonIndex: 2,
      },
      (buttonIndex) => {
        if (buttonIndex < BLOCK_TYPES.length) {
          onChangeBlock({ ...block, type: BLOCK_TYPES[buttonIndex].type });
        }
      }
    );

  const selectDestination = () => {
    if (!deck || !deck.cards) return false;

    showActionSheetWithOptions(
      {
        title: 'Destination',
        options: deck.cards
          .map((card) => card.title)
          .concat(['New Card'])
          .concat(['Cancel']),
        cancelButtonIndex: deck.cards.length + 1,
      },
      (buttonIndex) => {
        if (buttonIndex < deck.cards.length) {
          onChangeBlock({ ...block, destinationCardId: deck.cards[buttonIndex].cardId });
        } else if (buttonIndex == deck.cards.length) {
          onChangeBlock({ ...block, createDestinationCard: true });
        }
      }
    );
  };

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
    <View style={[styles.editDescriptionContainer, typeStyles.editDescriptionContainer]}>
      <View style={styles.editDescriptionRow}>
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
      <Text style={[styles.label, typeStyles.label]}>Block Type</Text>
      <Dropdown onPress={selectBlockType} value={blockType} styleSheet={typeStyles} />
      {block.type == 'choice' ? (
        <React.Fragment>
          <Text style={[styles.label, typeStyles.label]}>Destination</Text>
          <DestinationPicker
            onPress={selectDestination}
            value={destination}
            styleSheet={typeStyles}
          />
        </React.Fragment>
      ) : null}
    </View>
  );
};

export default EditBlock;
