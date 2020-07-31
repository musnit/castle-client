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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: DRAWING_CARD_FOOTER_HEIGHT,
  },

  colorPicker: {
    marginRight: 20,
  },

  icon: {
    marginLeft: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconSelected: {
    marginLeft: 10,
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const COLOR_ICON = '#FFF';
const COLOR_ICON_SELECTED = '#000';

export const DrawingCardBottomActions = () => {
  const { activeToolData, activeToolAction } = useCardCreator();

  if (!activeToolData.fillColor) {
    return null;
  }

  const isArtworkActive = activeToolData.currentMode == 'artwork';

  if (isArtworkActive) {
    const artworkSubtool = activeToolData.artworkSubtool;

    return (
      <View style={styles.container}>
        <View style={styles.colorPicker}>
          <ColorPicker
            value={{
              r: activeToolData.fillColor[0],
              g: activeToolData.fillColor[1],
              b: activeToolData.fillColor[2],
            }}
            setValue={(color) => {
              activeToolAction('updateFillColor', color);
            }}
          />
        </View>
        <View style={styles.colorPicker}>
          <ColorPicker
            value={{
              r: activeToolData.lineColor[0],
              g: activeToolData.lineColor[1],
              b: activeToolData.lineColor[2],
            }}
            setValue={(color) => {
              activeToolAction('updateLineColor', color);
            }}
          />
        </View>

        <TouchableOpacity
          style={artworkSubtool == 'pencil_no_grid' ? styles.iconSelected : styles.icon}
          onPress={() => activeToolAction('onSelectArtworkSubtool', 'pencil_no_grid')}>
          <Icon
            name="gesture"
            size={32}
            color={artworkSubtool == 'pencil_no_grid' ? COLOR_ICON_SELECTED : COLOR_ICON}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={artworkSubtool == 'line' ? styles.iconSelected : styles.icon}
          onPress={() => activeToolAction('onSelectArtworkSubtool', 'line')}>
          <MCIcon
            name="vector-line"
            size={32}
            color={artworkSubtool == 'line' ? COLOR_ICON_SELECTED : COLOR_ICON}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={artworkSubtool == 'pencil' ? styles.iconSelected : styles.icon}
          onPress={() => activeToolAction('onSelectArtworkSubtool', 'pencil')}>
          <MCIcon
            name="vector-polyline"
            size={32}
            color={artworkSubtool == 'pencil' ? COLOR_ICON_SELECTED : COLOR_ICON}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={artworkSubtool == 'move' ? styles.iconSelected : styles.icon}
          onPress={() => activeToolAction('onSelectArtworkSubtool', 'move')}>
          <Icon
            name="pan-tool"
            size={32}
            color={artworkSubtool == 'move' ? COLOR_ICON_SELECTED : COLOR_ICON}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={artworkSubtool == 'bend' ? styles.iconSelected : styles.icon}
          onPress={() => activeToolAction('onSelectArtworkSubtool', 'bend')}>
          <Icon
            name="rounded-corner"
            size={32}
            color={artworkSubtool == 'bend' ? COLOR_ICON_SELECTED : COLOR_ICON}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={artworkSubtool == 'fill' ? styles.iconSelected : styles.icon}
          onPress={() => activeToolAction('onSelectArtworkSubtool', 'fill')}>
          <Icon
            name="format-paint"
            size={32}
            color={artworkSubtool == 'fill' ? COLOR_ICON_SELECTED : COLOR_ICON}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={artworkSubtool == 'erase' ? styles.iconSelected : styles.icon}
          onPress={() => activeToolAction('onSelectArtworkSubtool', 'erase')}>
          <Icon
            name="clear"
            size={32}
            color={artworkSubtool == 'erase' ? COLOR_ICON_SELECTED : COLOR_ICON}
          />
        </TouchableOpacity>
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
