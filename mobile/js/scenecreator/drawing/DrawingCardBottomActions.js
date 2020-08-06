import React from 'react';
import { PixelRatio, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useCardCreator } from '../../scenecreator/CreateCardContext';
import ColorPicker from '../../scenecreator/inspector/components/ColorPicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

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
    marginLeft: 4,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
  },
});

const COLOR_ICON = '#FFF';
const COLOR_ICON_SELECTED = '#000';
const ICON_SIZE = 22;

export const DrawingCardBottomActions = () => {
  const { activeToolData, activeToolAction } = useCardCreator();

  if (!activeToolData.color) {
    return null;
  }

  const isArtworkActive = activeToolData.currentMode == 'artwork';

  if (isArtworkActive) {
    const artworkSubtool = activeToolData.artworkSubtool;

    return (
      <View style={styles.container}>
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

        <View style={styles.subtools}>
          <TouchableOpacity
            style={artworkSubtool == 'pencil_no_grid' ? styles.iconSelected : styles.icon}
            onPress={() => activeToolAction('onSelectArtworkSubtool', 'pencil_no_grid')}>
            <Icon
              name="gesture"
              size={ICON_SIZE}
              color={artworkSubtool == 'pencil_no_grid' ? COLOR_ICON_SELECTED : COLOR_ICON}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={artworkSubtool == 'line' ? styles.iconSelected : styles.icon}
            onPress={() => activeToolAction('onSelectArtworkSubtool', 'line')}>
            <MCIcon
              name="vector-line"
              size={ICON_SIZE}
              color={artworkSubtool == 'line' ? COLOR_ICON_SELECTED : COLOR_ICON}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={artworkSubtool == 'pencil' ? styles.iconSelected : styles.icon}
            onPress={() => activeToolAction('onSelectArtworkSubtool', 'pencil')}>
            <MCIcon
              name="vector-polyline"
              size={ICON_SIZE}
              color={artworkSubtool == 'pencil' ? COLOR_ICON_SELECTED : COLOR_ICON}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={artworkSubtool == 'move' ? styles.iconSelected : styles.icon}
            onPress={() => activeToolAction('onSelectArtworkSubtool', 'move')}>
            <MCIcon
              name="vector-point"
              size={ICON_SIZE}
              color={artworkSubtool == 'move' ? COLOR_ICON_SELECTED : COLOR_ICON}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={artworkSubtool == 'bend' ? styles.iconSelected : styles.icon}
            onPress={() => activeToolAction('onSelectArtworkSubtool', 'bend')}>
            <MCIcon
              name="vector-radius"
              size={ICON_SIZE}
              color={artworkSubtool == 'bend' ? COLOR_ICON_SELECTED : COLOR_ICON}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={artworkSubtool == 'fill' ? styles.iconSelected : styles.icon}
            onPress={() => activeToolAction('onSelectArtworkSubtool', 'fill')}>
            <MCIcon
              name="format-color-fill"
              size={ICON_SIZE + 6}
              color={artworkSubtool == 'fill' ? COLOR_ICON_SELECTED : COLOR_ICON}
              style={{ marginTop: 8 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={artworkSubtool == 'erase' ? styles.iconSelected : styles.icon}
            onPress={() => activeToolAction('onSelectArtworkSubtool', 'erase')}>
            <MCIcon
              name="eraser"
              size={ICON_SIZE}
              color={artworkSubtool == 'erase' ? COLOR_ICON_SELECTED : COLOR_ICON}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  } else {
    const collisionSubtool = activeToolData.collisionSubtool;

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={collisionSubtool == 'move' ? styles.iconSelected : styles.icon}
          onPress={() => activeToolAction('onSelectCollisionSubtool', 'move')}>
          <Icon
            name="open-with"
            size={32}
            color={collisionSubtool == 'move' ? COLOR_ICON_SELECTED : COLOR_ICON}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={collisionSubtool == 'scale-rotate' ? styles.iconSelected : styles.icon}
          onPress={() => activeToolAction('onSelectCollisionSubtool', 'scale-rotate')}>
          <Icon
            name="crop-rotate"
            size={32}
            color={collisionSubtool == 'scale-rotate' ? COLOR_ICON_SELECTED : COLOR_ICON}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={collisionSubtool == 'erase' ? styles.iconSelected : styles.icon}
          onPress={() => activeToolAction('onSelectCollisionSubtool', 'erase')}>
          <Icon
            name="clear"
            size={32}
            color={collisionSubtool == 'erase' ? COLOR_ICON_SELECTED : COLOR_ICON}
          />
        </TouchableOpacity>
      </View>
    );
  }
};
