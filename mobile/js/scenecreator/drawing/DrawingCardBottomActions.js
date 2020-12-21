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

export const DrawingCardBottomActions = () => {
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

  const isArtworkActive = activeToolData.selectedSubtools.root == 'artwork';
  const currentDrawingToolGroup = isArtworkActive
    ? activeToolData.selectedSubtools.artwork
    : activeToolData.selectedSubtools.collision;

  if (isArtworkActive) {
    const artworkDrawSubtool = activeToolData.selectedSubtools.artwork_draw;
    const artworkMoveSubtool = activeToolData.selectedSubtools.artwork_move;
    const artworkEraseSubtool = activeToolData.selectedSubtools.artwork_erase;
    const showColorPicker =
      currentDrawingToolGroup == 'artwork_draw' || currentDrawingToolGroup == 'fill';

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
          {currentDrawingToolGroup == 'artwork_draw' ? (
            <Fragment>
              <TouchableOpacity
                style={
                  artworkDrawSubtool == 'pencil_no_grid'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectSubtool', 'artwork_draw:pencil_no_grid')}>
                <Icon
                  name="gesture"
                  size={ICON_SIZE}
                  color={
                    artworkDrawSubtool == 'pencil_no_grid' ? activeColorForeground : COLOR_ICON
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  artworkDrawSubtool == 'pencil'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectSubtool', 'artwork_draw:pencil')}>
                <MCIcon
                  name="vector-polyline"
                  size={ICON_SIZE}
                  color={artworkDrawSubtool == 'pencil' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  artworkDrawSubtool == 'line'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectSubtool', 'artwork_draw:line')}>
                <MCIcon
                  name="vector-line"
                  size={ICON_SIZE}
                  color={artworkDrawSubtool == 'line' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  artworkDrawSubtool == 'rectangle'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectSubtool', 'artwork_draw:rectangle')}>
                <MCIcon
                  name="square-outline"
                  size={ICON_SIZE}
                  color={artworkDrawSubtool == 'rectangle' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  artworkDrawSubtool == 'circle'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectSubtool', 'artwork_draw:circle')}>
                <MCIcon
                  name="circle-outline"
                  size={ICON_SIZE}
                  color={artworkDrawSubtool == 'circle' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  artworkDrawSubtool == 'triangle'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectSubtool', 'artwork_draw:triangle')}>
                <MCIcon
                  name="triangle-outline"
                  size={ICON_SIZE}
                  color={artworkDrawSubtool == 'triangle' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>
            </Fragment>
          ) : null}

          {currentDrawingToolGroup == 'artwork_move' ? (
            <Fragment>
              <TouchableOpacity
                style={
                  artworkMoveSubtool == 'move'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectSubtool', 'artwork_move:move')}>
                <MCIcon
                  name="vector-point"
                  size={ICON_SIZE}
                  color={artworkMoveSubtool == 'move' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  artworkMoveSubtool == 'bend'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectSubtool', 'artwork_move:bend')}>
                <MCIcon
                  name="vector-radius"
                  size={ICON_SIZE}
                  color={artworkMoveSubtool == 'bend' ? activeColorForeground : COLOR_ICON}
                />
              </TouchableOpacity>
            </Fragment>
          ) : null}

          {currentDrawingToolGroup == 'artwork_erase' ? (
            <Fragment>
              <TouchableOpacity
                style={
                  artworkEraseSubtool == 'erase_small'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectSubtool', 'artwork_erase:erase_small')}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: 'white',
                    borderRadius: 10,
                  }}></View>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  artworkEraseSubtool == 'erase_medium'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectSubtool', 'artwork_erase:erase_medium')}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    backgroundColor: 'white',
                    borderRadius: 15,
                  }}></View>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  artworkEraseSubtool == 'erase_large'
                    ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                    : styles.icon
                }
                onPress={() => activeToolAction('onSelectSubtool', 'artwork_erase:erase_large')}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: 'white',
                    borderRadius: 20,
                  }}></View>
              </TouchableOpacity>
            </Fragment>
          ) : null}
        </View>
      </View>
    );
  } else {
    const collisionDrawSubtool = activeToolData.selectedSubtools.collision_draw;
    const collisionMoveSubtool = activeToolData.selectedSubtools.collision_move;

    return (
      <View style={[styles.container, styles.containerCentered]}>
        {currentDrawingToolGroup == 'collision_draw' ? (
          <Fragment>
            <TouchableOpacity
              style={
                collisionDrawSubtool == 'rectangle'
                  ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                  : styles.icon
              }
              onPress={() => activeToolAction('onSelectSubtool', 'collision_draw:rectangle')}>
              <MCIcon
                name="square-outline"
                size={ICON_SIZE}
                color={collisionDrawSubtool == 'rectangle' ? activeColorForeground : COLOR_ICON}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={
                collisionDrawSubtool == 'circle'
                  ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                  : styles.icon
              }
              onPress={() => activeToolAction('onSelectSubtool', 'collision_draw:circle')}>
              <MCIcon
                name="circle-outline"
                size={ICON_SIZE}
                color={collisionDrawSubtool == 'circle' ? activeColorForeground : COLOR_ICON}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={
                collisionDrawSubtool == 'triangle'
                  ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                  : styles.icon
              }
              onPress={() => activeToolAction('onSelectSubtool', 'collision_draw:triangle')}>
              <MCIcon
                name="triangle-outline"
                size={ICON_SIZE}
                color={collisionDrawSubtool == 'triangle' ? activeColorForeground : COLOR_ICON}
              />
            </TouchableOpacity>
          </Fragment>
        ) : null}
        {currentDrawingToolGroup == 'collision_move' ? (
          <Fragment>
            <TouchableOpacity
              style={
                collisionMoveSubtool == 'move'
                  ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                  : styles.icon
              }
              onPress={() => activeToolAction('onSelectSubtool', 'collision_move:move')}>
              <Icon
                name="open-with"
                size={ICON_SIZE}
                color={collisionMoveSubtool == 'move' ? activeColorForeground : COLOR_ICON}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={
                collisionMoveSubtool == 'scale-rotate'
                  ? [styles.iconSelected, { backgroundColor: activeColorBackground }]
                  : styles.icon
              }
              onPress={() => activeToolAction('onSelectSubtool', 'collision_move:scale-rotate')}>
              <MCIcon
                name="vector-point"
                size={ICON_SIZE}
                color={collisionMoveSubtool == 'scale-rotate' ? activeColorForeground : COLOR_ICON}
              />
            </TouchableOpacity>
          </Fragment>
        ) : null}
      </View>
    );
  }
};
