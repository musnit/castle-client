import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';
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
  toolGroup: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  toolGroupPicker: {
    marginTop: 8,
  },
  toolGroupLabel: {},
  toolGroupIcon: {
    marginTop: 4,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const DrawingCardHeader = ({
  onPressBack,
  currentDrawingToolGroup,
  onSelectDrawingToolGroup,
}) => {
  const { globalActions, sendGlobalAction } = useGhostUI();
  const { activeToolData, activeToolAction } = useCardCreator();

  if (!activeToolData) {
    return null;
  }

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

      <View style={styles.toolGroupPicker}>
        <View style={styles.shapeContainer}>
          <TouchableOpacity
            style={styles.toolGroup}
            onPress={() => {
              onSelectDrawingToolGroup('draw');
              if (isArtworkActive) {
                onSelectSubtool('pencil');
              } else {
                onSelectSubtool('rectangle');
              }
            }}>
            <Text
              style={[
                styles.toolGroupLabel,
                { color: currentDrawingToolGroup == 'draw' ? '#fff' : '#888' },
              ]}>
              Draw
            </Text>
            <View style={styles.toolGroupIcon}>
              <MCIcon
                name="pencil-outline"
                size={36}
                color={currentDrawingToolGroup == 'draw' ? '#fff' : '#888'}
              />
            </View>
          </TouchableOpacity>

          {isArtworkActive ? (
            <TouchableOpacity
              style={styles.toolGroup}
              onPress={() => {
                onSelectDrawingToolGroup('fill');
                onSelectSubtool('fill');
              }}>
              <Text
                style={[
                  styles.toolGroupLabel,
                  { color: currentDrawingToolGroup == 'fill' ? '#fff' : '#888' },
                ]}>
                Fill
              </Text>
              <View style={styles.toolGroupIcon}>
                <MCIcon
                  name="format-color-fill"
                  size={38}
                  color={currentDrawingToolGroup == 'fill' ? '#fff' : '#888'}
                  style={{ marginTop: 4 }}
                />
              </View>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.toolGroup}
            onPress={() => {
              onSelectDrawingToolGroup('move');
              onSelectSubtool('move');
            }}>
            <Text
              style={[
                styles.toolGroupLabel,
                { color: currentDrawingToolGroup == 'move' ? '#fff' : '#888' },
              ]}>
              Move
            </Text>
            <View style={styles.toolGroupIcon}>
              <Icon
                name="pan-tool"
                size={28}
                color={currentDrawingToolGroup == 'move' ? '#fff' : '#888'}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolGroup}
            onPress={() => {
              onSelectDrawingToolGroup('erase');
              onSelectSubtool('erase');
            }}>
            <Text
              style={[
                styles.toolGroupLabel,
                { color: currentDrawingToolGroup == 'erase' ? '#fff' : '#888' },
              ]}>
              Erase
            </Text>
            <View style={styles.toolGroupIcon}>
              <MCIcon
                name="eraser"
                size={36}
                color={currentDrawingToolGroup == 'erase' ? '#fff' : '#888'}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
