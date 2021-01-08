import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useGhostUI, useFastDataMemo } from '../../ghost/GhostUI';
import { useCardCreator } from '../../scenecreator/CreateCardContext';
import { SegmentedNavigation } from '../../components/SegmentedNavigation';
import * as Constants from '../../Constants';
import { DrawingCardBottomActions } from './DrawingCardBottomActions';
import tinycolor from 'tinycolor2';

export const DRAWING_CARD_HEADER_HEIGHT = 200;

const styles = StyleSheet.create({
  container: {
    zIndex: 1, // we use negative margin to place the scene behind the header
    height: DRAWING_CARD_HEADER_HEIGHT,
    flexDirection: 'column',
  },
  topContainer: {
    paddingTop: 8,
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
  action: {
    paddingHorizontal: 8,
  },
  navigation: {
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
  },
  toolGroups: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnBlackBorder,
  },
  toolGroup: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  toolGroupLabel: {},
  toolGroupIcon: {
    marginTop: 4,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const DrawingCardHeader = useFastDataMemo(
  'draw-tools',
  ({ fastData, fastAction, onPressBack }) => {
    const { globalActions, sendGlobalAction } = useGhostUI();

    if (!fastData.selectedSubtools) {
      return null;
    }

    let undoButton, redoButton;
    if (globalActions) {
      const data = globalActions;

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

    const isArtworkActive = fastData.selectedSubtools.root == 'artwork';
    const currentDrawingToolGroup = isArtworkActive
      ? fastData.selectedSubtools.artwork
      : fastData.selectedSubtools.collision;

    const MODE_ITEMS = [
      {
        name: 'Artwork',
        value: 'artwork',
      },
      {
        name: 'Collision Shape',
        value: 'collision',
      },
    ];

    // Only hide status bar on iOS because adjustResize breaks when android is in fullscreen.
    // This breaks keyboard avoiding for popovers. See https://issuetracker.google.com/issues/36911528
    return (
      <View style={styles.container}>
        <View style={styles.topContainer}>
          <StatusBar hidden={Platform.OS != 'android'} />
          <TouchableOpacity style={styles.back} onPress={onPressBack}>
            <MCIcon name="arrow-left" size={32} color="#fff" />
          </TouchableOpacity>
          <View style={styles.actionsContainer}>
            {undoButton}
            {redoButton}
            <TouchableOpacity
              style={styles.action}
              onPressIn={() => {
                fastAction('onViewInContext', 'true');
              }}
              onPressOut={() => {
                fastAction('onViewInContext', 'false');
              }}>
              <MCIcon
                name={Constants.iOS ? 'image-frame' : 'image-filter-frames'}
                size={24}
                color={'#fff'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.navigation}>
          <SegmentedNavigation
            items={MODE_ITEMS}
            selectedItem={isArtworkActive ? MODE_ITEMS[0] : MODE_ITEMS[1]}
            onSelectItem={(item) => fastAction('onSelectSubtool', 'root:' + item.value)}
          />
        </View>

        <View style={styles.toolGroups}>
          <TouchableOpacity
            style={styles.toolGroup}
            onPress={() => {
              if (isArtworkActive) {
                fastAction('onSelectSubtool', 'artwork:artwork_draw');
              } else {
                fastAction('onSelectSubtool', 'collision:collision_draw');
              }
            }}>
            <View style={styles.toolGroupIcon}>
              <MCIcon
                name="pencil-outline"
                size={36}
                color={
                  currentDrawingToolGroup == 'artwork_draw' ||
                  currentDrawingToolGroup == 'collision_draw'
                    ? '#fff'
                    : '#888'
                }
              />
            </View>
          </TouchableOpacity>

          {isArtworkActive ? (
            <TouchableOpacity
              style={styles.toolGroup}
              onPress={() => {
                fastAction('onSelectSubtool', 'artwork:fill');
              }}>
              <View style={styles.toolGroupIcon}>
                <MCIcon
                  name="format-color-fill"
                  size={38}
                  color={currentDrawingToolGroup == 'fill' ? '#fff' : '#888'}
                  style={{ marginTop: 9 }}
                />
              </View>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.toolGroup}
            onPress={() => {
              if (isArtworkActive) {
                fastAction('onSelectSubtool', 'artwork:artwork_move');
              } else {
                fastAction('onSelectSubtool', 'collision:collision_move');
              }
            }}>
            <View style={styles.toolGroupIcon}>
              <Icon
                name="pan-tool"
                size={28}
                color={
                  currentDrawingToolGroup == 'artwork_move' ||
                  currentDrawingToolGroup == 'collision_move'
                    ? '#fff'
                    : '#888'
                }
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolGroup}
            onPress={() => {
              if (isArtworkActive) {
                fastAction('onSelectSubtool', 'artwork:artwork_erase');
              } else {
                fastAction('onSelectSubtool', 'collision:collision_erase');
              }
            }}>
            <View style={styles.toolGroupIcon}>
              <MCIcon
                name="eraser"
                size={36}
                color={
                  currentDrawingToolGroup == 'artwork_erase' ||
                  currentDrawingToolGroup == 'collision_erase'
                    ? '#fff'
                    : '#888'
                }
                style={{ marginTop: 3 }}
              />
            </View>
          </TouchableOpacity>
        </View>
        <DrawingCardBottomActions />
      </View>
    );
  }
);
