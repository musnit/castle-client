import React, { Fragment } from 'react';
import { PixelRatio, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useCardCreator } from '../../scenecreator/CreateCardContext';
import ColorPicker from '../../scenecreator/inspector/components/ColorPicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import tinycolor from 'tinycolor2';

export const DRAWING_CARD_FOOTER_HEIGHT = 80;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: DRAWING_CARD_FOOTER_HEIGHT,
  },

  containerCentered: {
    justifyContent: 'center',
  },

  colorPickers: {
    flexDirection: 'row',
    paddingLeft: 8,
  },

  subtools: {
    flexDirection: 'row',
  },
  icon: {
    marginLeft: 6,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSelected: {
    marginLeft: 6,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
});

const COLOR_ICON = '#888';
const ICON_SIZE = 22;

export const DrawingCardBottomActions = ({ currentDrawingToolGroup }) => {
  const { activeToolData, activeToolAction } = useCardCreator();

  if (!activeToolData.color) {
    return null;
  }

  const activeColor = tinycolor.fromRatio({
    r: activeToolData.color[0],
    g: activeToolData.color[1],
    b: activeToolData.color[2],
  });
  const activeColorBackground = activeColor.toHexString();
  const activeColorForeground = activeColor.isLight() ? '#000' : '#fff';

  const isArtworkActive = activeToolData.currentMode == 'artwork';

  if (isArtworkActive) {
    const artworkSubtool = activeToolData.artworkSubtool;
    const showColorPicker = currentDrawingToolGroup == 'draw' || currentDrawingToolGroup == 'fill';

    return (
      <View style={[styles.container, showColorPicker ? null : styles.containerCentered]}>
        {showColorPicker ? (
          <View style={styles.colorPickers}>
            <View style={styles.colorPicker}>
              <ColorPicker
                value={{
                  r: activeToolData.color[0],
                  g: activeToolData.color[1],
                  b: activeToolData.color[2],
                }}
                setValue={(color) => {
                  activeToolAction('updateColor', color);
                }}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.subtools}>
          {currentDrawingToolGroup == 'draw' ? (
            <Fragment>
              <TouchableOpacity
                style={
                  artworkSubtool == 'pencil_no_grid'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectArtworkSubtool', 'pencil_no_grid')}>
                <Icon
                  name="gesture"
                  size={ICON_SIZE}
                  color={artworkSubtool == 'pencil_no_grid' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  artworkSubtool == 'pencil'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectArtworkSubtool', 'pencil')}>
                <MCIcon
                  name="vector-polyline"
                  size={ICON_SIZE}
                  color={artworkSubtool == 'pencil' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  artworkSubtool == 'line'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectArtworkSubtool', 'line')}>
                <MCIcon
                  name="vector-line"
                  size={ICON_SIZE}
                  color={artworkSubtool == 'line' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  artworkSubtool == 'rectangle'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectArtworkSubtool', 'rectangle')}>
                <MCIcon
                  name="square-outline"
                  size={ICON_SIZE}
                  color={artworkSubtool == 'rectangle' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  artworkSubtool == 'circle'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectArtworkSubtool', 'circle')}>
                <MCIcon
                  name="circle-outline"
                  size={ICON_SIZE}
                  color={artworkSubtool == 'circle' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  artworkSubtool == 'triangle'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectArtworkSubtool', 'triangle')}>
                <MCIcon
                  name="triangle-outline"
                  size={ICON_SIZE}
                  color={artworkSubtool == 'triangle' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>
            </Fragment>
          ) : null}

          {currentDrawingToolGroup == 'move' ? (
            <Fragment>
              <TouchableOpacity
                style={
                  artworkSubtool == 'move'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectArtworkSubtool', 'move')}>
                <MCIcon
                  name="vector-point"
                  size={ICON_SIZE}
                  color={artworkSubtool == 'move' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  artworkSubtool == 'bend'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectArtworkSubtool', 'bend')}>
                <MCIcon
                  name="vector-radius"
                  size={ICON_SIZE}
                  color={artworkSubtool == 'bend' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>
            </Fragment>
          ) : null}
        </View>
      </View>
    );
  } else {
    const collisionSubtool = activeToolData.collisionSubtool;

    return (
      <View style={[styles.container, styles.containerCentered]}>
        {currentDrawingToolGroup == 'draw' ? (
          <Fragment>
            <TouchableOpacity
              style={
                collisionSubtool == 'rectangle'
                  ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                  : styles.icon
              }
              onPress={() => activeToolAction('onSelectCollisionSubtool', 'rectangle')}>
              <MCIcon
                name="square-outline"
                size={ICON_SIZE}
                color={collisionSubtool == 'rectangle' ? activeColorForeground : COLOR_ICON}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={
                collisionSubtool == 'circle'
                  ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                  : styles.icon
              }
              onPress={() => activeToolAction('onSelectCollisionSubtool', 'circle')}>
              <MCIcon
                name="circle-outline"
                size={ICON_SIZE}
                color={collisionSubtool == 'circle' ? activeColorForeground : COLOR_ICON}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={
                collisionSubtool == 'triangle'
                  ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                  : styles.icon
              }
              onPress={() => activeToolAction('onSelectCollisionSubtool', 'triangle')}>
              <MCIcon
                name="triangle-outline"
                size={ICON_SIZE}
                color={collisionSubtool == 'triangle' ? activeColorForeground : COLOR_ICON}
              />
            </TouchableOpacity>
          </Fragment>
        ) : null}
        {currentDrawingToolGroup == 'move' ? (
          <Fragment>
            <TouchableOpacity
              style={
                collisionSubtool == 'move'
                  ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                  : styles.icon
              }
              onPress={() => activeToolAction('onSelectCollisionSubtool', 'move')}>
              <Icon
                name="open-with"
                size={ICON_SIZE}
                color={collisionSubtool == 'move' ? activeColorForeground : COLOR_ICON}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={
                collisionSubtool == 'scale-rotate'
                  ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                  : styles.icon
              }
              onPress={() => activeToolAction('onSelectCollisionSubtool', 'scale-rotate')}>
              <Icon
                name="crop-rotate"
                size={ICON_SIZE}
                color={collisionSubtool == 'scale-rotate' ? activeColorForeground : COLOR_ICON}
              />
            </TouchableOpacity>
          </Fragment>
        ) : null}
      </View>
    );
  }
};
