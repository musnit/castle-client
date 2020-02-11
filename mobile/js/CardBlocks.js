import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';

import * as Constants from './Constants';

import AddBlockPlaceholder from './AddBlockPlaceholder';
import EditBlock from './EditBlock';
import FastImage from 'react-native-fast-image';

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
});

const CardBlock = (props) => {
  const { block } = props;
  let blockStyles, textStyles;
  switch (block.type) {
    case 'choice': {
      return (
        <TouchableOpacity style={[styles.choiceBlock, props.style]} onPress={props.onSelect}>
          <Text style={styles.choiceBlockDescription}>{block.title}</Text>
          <TouchableOpacity disabled={!props.isEditable} onPress={props.onSelectDestination}>
            <FastImage
              style={{
                width: 22,
                aspectRatio: 1,
                flexShrink: 0,
              }}
              source={require('../assets/images/arrow-circle-right.png')}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }
    case 'text':
    default: {
      return (
        <TouchableOpacity
          style={[styles.textBlock, props.style]}
          onPress={props.onSelect}
          disabled={!props.isEditable}>
          <Text style={styles.textBlockDescription}>{block.title}</Text>
        </TouchableOpacity>
      );
      break;
    }
  }
};

const CardBlocks = (props) => {
  const card = props.card || {};
  const { editBlockProps } = props;
  const blockIdToEdit =
    editBlockProps && editBlockProps.blockToEdit ? editBlockProps.blockToEdit.cardBlockId : null;
  const isAddingBlock = editBlockProps && editBlockProps.isEditingBlock && !blockIdToEdit;
  let orderedBlocks;
  if (card.blocks && card.blocks.length) {
    orderedBlocks = card.blocks.sort((a, b) => a.type - b.type);
  }
  if (orderedBlocks || isAddingBlock) {
    return (
      <React.Fragment>
        {orderedBlocks &&
          orderedBlocks.map((block, ii) => {
            const prevBlockType = ii > 0 ? orderedBlocks[ii - 1].type : block.type;
            const styles = block.type !== prevBlockType ? { marginTop: 8 } : null;
            if (blockIdToEdit && block.cardBlockId === blockIdToEdit) {
              return <EditBlock key={`${block.cardBlockId}-${ii}`} {...editBlockProps} />;
            } else {
              return (
                <CardBlock
                  key={`${block.cardBlockId}-${ii}`}
                  block={block}
                  style={styles}
                  isEditable={props.isEditable}
                  onSelect={() => props.onSelectBlock(block.cardBlockId)}
                  onSelectDestination={() => props.onSelectDestination(block)}
                />
              );
            }
          })}
        {isAddingBlock ? <EditBlock {...editBlockProps} /> : null}
      </React.Fragment>
    );
  } else if (props.isEditable) {
    return <AddBlockPlaceholder onPress={() => props.onSelectBlock(null)} />;
  } else {
    return null;
  }
};

export default CardBlocks;
