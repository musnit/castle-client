import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGhostUI } from '../../ghost/GhostUI';
import { useCardCreator } from '../../scenecreator/CreateCardContext';
import { SegmentedNavigation } from '../../components/SegmentedNavigation';
import * as Constants from '../../Constants';
import tinycolor from 'tinycolor2';

export const DRAWING_CARD_HEADER_HEIGHT = 150;

const styles = StyleSheet.create({
  container: {
    zIndex: 1, // we use negative margin to place the scene behind the header
    height: DRAWING_CARD_HEADER_HEIGHT,
    flexDirection: 'column',
  },
  topContainer: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionsContainer: {
    width: '100%',
    height: '100%',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -54, // required to center properly with back button
    zIndex: -1, // required to prevent negative margin from blocking back button
  },

  navigation: {
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
  },

  shapeContainer: {
    width: '100%',
    height: '50%',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  activeShape: {
    color: '#fff',
    textDecorationLine: 'underline',
  },
  shape: {
    color: '#fff',
  },
  action: {
    paddingHorizontal: 8,
  },
});

export const DrawingCardHeader = ({ onPressBack }) => {
  const { globalActions, sendGlobalAction } = useGhostUI();
  const { activeToolData, activeToolAction } = useCardCreator();

  const activeColor = tinycolor.fromRatio({
    r: activeToolData.color[0],
    g: activeToolData.color[1],
    b: activeToolData.color[2],
  }).toHexString();

  let undoButton, redoButton;
  if (globalActions) {
    const data = globalActions;
    isPlaying = data.performing;

    undoButton = (
      <TouchableOpacity
        style={styles.action}
        disabled={!data.actionsAvailable.onUndo}
        onPress={() => sendGlobalAction('onUndo')}>
        <MCIcon
          name="undo-variant"
          size={26}
          color={data.actionsAvailable.onUndo ? '#fff' : '#666'}
        />
      </TouchableOpacity>
    );

    redoButton = (
      <TouchableOpacity
        style={styles.action}
        disabled={!data.actionsAvailable.onRedo}
        onPress={() => sendGlobalAction('onRedo')}>
        <MCIcon
          name="redo-variant"
          size={26}
          color={data.actionsAvailable.onRedo ? '#fff' : '#666'}
        />
      </TouchableOpacity>
    );
  }

  const isArtworkActive = activeToolData.currentMode == 'artwork';
  const artworkSubtool = activeToolData.artworkSubtool;
  const collisionSubtool = activeToolData.collisionSubtool;
  const currentShape = isArtworkActive ? artworkSubtool : collisionSubtool;
  const onSelectSubtool = isArtworkActive
    ? (subtool) => {
        activeToolAction('onSelectArtworkSubtool', subtool);
      }
    : (subtool) => {
        activeToolAction('onSelectCollisionSubtool', subtool);
      };

  const MODE_ITEMS = [
    {
      name: 'Artwork',
      value: 'onSelectArtwork',
    },
    {
      name: 'Collision',
      value: 'onSelectCollision',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <StatusBar hidden={true} />
        <TouchableOpacity style={styles.back} onPress={onPressBack}>
          <MCIcon name="arrow-left" size={32} color="#fff" />
        </TouchableOpacity>
        <View style={styles.actionsContainer}>
          {undoButton}
          {redoButton}
        </View>
      </View>

      <View style={styles.navigation}>
        <SegmentedNavigation
          items={MODE_ITEMS}
          selectedItem={isArtworkActive ? MODE_ITEMS[0] : MODE_ITEMS[1]}
          onSelectItem={(item) => activeToolAction(item.value)}
        />
      </View>

      <View style={styles.shapeContainer}>
        {false && (
          <TouchableOpacity style={styles.action} onPress={() => onSelectSubtool('line')}>
            <Text style={currentShape == 'line' ? styles.activeShape : styles.shape}>Line</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.action} onPress={() => onSelectSubtool('rectangle')}>
          <MCIcon name="square-outline" size={48} color={currentShape == 'rectangle' ? activeColor : "#888"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={() => onSelectSubtool('circle')}>
          <MCIcon name="circle-outline" size={48} color={currentShape == 'circle' ? activeColor : "#888"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={() => onSelectSubtool('triangle')}>
          <MCIcon name="triangle-outline" size={48} color={currentShape == 'triangle' ? activeColor : "#888"} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
