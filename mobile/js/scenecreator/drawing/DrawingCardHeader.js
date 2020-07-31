import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGhostUI } from '../../ghost/GhostUI';
import { useCardCreator } from '../../scenecreator/CreateCardContext';
import { SegmentedNavigation } from '../../components/SegmentedNavigation';

export const DRAWING_CARD_HEADER_HEIGHT = 150;

const styles = StyleSheet.create({
  container: {
    zIndex: 1, // we use negative margin to place the scene behind the header
    height: DRAWING_CARD_HEADER_HEIGHT,
    flexDirection: 'column',
  },
  topContainer: {
    height: '25%',
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
  modeContainer: {
    width: '100%',
    height: '25%',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkOrCollisionText: {
    color: '#fff',
  },
  artworkOrCollisionActiveText: {
    color: '#fff',
    textDecorationLine: 'underline',
  },
  shapeContainer: {
    width: '100%',
    height: '50%',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
      <View style={styles.modeContainer}>
        <TouchableOpacity style={styles.action} onPress={() => activeToolAction('onSelectArtwork')}>
          <Text
            style={
              isArtworkActive ? styles.artworkOrCollisionActiveText : styles.artworkOrCollisionText
            }>
            Artwork
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={() => activeToolAction('onSelectCollision')}>
          <Text
            style={
              !isArtworkActive ? styles.artworkOrCollisionActiveText : styles.artworkOrCollisionText
            }>
            Collision
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.shapeContainer}>
        {false && (
          <TouchableOpacity style={styles.action} onPress={() => onSelectSubtool('line')}>
            <Text style={currentShape == 'line' ? styles.activeShape : styles.shape}>Line</Text>
          </TouchableOpacity>
        )}

        {!isArtworkActive && (
          <TouchableOpacity style={styles.action} onPress={() => onSelectSubtool('rectangle')}>
            <Text style={currentShape == 'rectangle' ? styles.activeShape : styles.shape}>
              Rectangle
            </Text>
          </TouchableOpacity>
        )}

        {!isArtworkActive && (
          <TouchableOpacity style={styles.action} onPress={() => onSelectSubtool('circle')}>
            <Text style={currentShape == 'circle' ? styles.activeShape : styles.shape}>Circle</Text>
          </TouchableOpacity>
        )}

        {!isArtworkActive && (
          <TouchableOpacity style={styles.action} onPress={() => onSelectSubtool('triangle')}>
            <Text style={currentShape == 'triangle' ? styles.activeShape : styles.shape}>
              Triangle
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
