import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useCoreState, sendGlobalAction, sendAsync } from '../../core/CoreEvents';

import * as Constants from '../../Constants';
const CastleIcon = Constants.CastleIcon;

import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  toolbar: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    flexDirection: 'column',
    alignItems: 'center',
    ...Constants.styles.dropShadow,
  },
  button: {
    height: 36,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: Constants.colors.black,
  },
  eraseIconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const ICON_SIZE = 22;

const makeButtonStyles = (value, name) => {
  return value == name ? [styles.button, { backgroundColor: '#000' }] : [styles.button];
};

const makeIconColor = (value, name) => {
  return value == name ? '#fff' : '#000';
};

const EraseIcon = ({ size, color }) => (
  <View style={styles.eraseIconContainer}>
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size,
      }}
    />
  </View>
);

const DRAW_SUBTOOLS = {
  artwork_draw: [
    {
      name: 'pencil_no_grid',
      IconComponent: CastleIcon,
      icon: 'draw-freehand',
    },
    {
      name: 'line',
      IconComponent: CastleIcon,
      icon: 'draw-line',
    },
    {
      name: 'rectangle',
      IconComponent: CastleIcon,
      icon: 'draw-rectangle',
    },
    {
      name: 'circle',
      IconComponent: CastleIcon,
      icon: 'draw-ellipse',
    },
    {
      name: 'triangle',
      IconComponent: CastleIcon,
      icon: 'draw-triangle',
    },
  ],
  artwork_fill: [
    {
      name: 'flood_fill',
      IconComponent: CastleIcon,
      icon: 'fill',
    },
    {
      name: 'palette_swap',
      IconComponent: MCIcon,
      icon: 'swap-horizontal',
    },
  ],
  artwork_move: [
    {
      name: 'move',
      IconComponent: MCIcon,
      icon: 'vector-point',
    },
    {
      name: 'bend',
      IconComponent: MCIcon,
      icon: 'vector-radius',
    },
    {
      name: 'move_all',
      IconComponent: MCIcon,
      icon: 'cursor-move',
    },
  ],
  artwork_erase: [
    {
      name: 'erase_segment',
      IconComponent: MCIcon,
      icon: 'content-cut',
    },
    {
      name: 'erase_large',
      IconComponent: EraseIcon,
      size: 22,
    },
    {
      name: 'erase_medium',
      IconComponent: EraseIcon,
      size: 16,
    },
    {
      name: 'erase_small',
      IconComponent: EraseIcon,
      size: 7,
    },
  ],
  collision_draw: [
    {
      name: 'rectangle',
      IconComponent: MCIcon,
      icon: 'square-outline',
    },
    {
      name: 'circle',
      IconComponent: MCIcon,
      icon: 'circle-outline',
    },
    {
      name: 'triangle',
      IconComponent: MCIcon,
      icon: 'triangle-outline',
    },
  ],
  collision_move: [
    {
      name: 'scale-rotate',
      IconComponent: MCIcon,
      icon: 'vector-point',
    },
    {
      name: 'move',
      IconComponent: MCIcon,
      icon: 'shape',
    },
    {
      name: 'move_all',
      IconComponent: MCIcon,
      icon: 'cursor-move',
    },
  ],
  bitmap_fill: [
    {
      name: 'flood_fill',
      IconComponent: CastleIcon,
      icon: 'fill',
    },
    {
      name: 'palette_swap',
      IconComponent: MCIcon,
      icon: 'swap-horizontal',
    },
  ],
  bitmap_erase: [
    {
      name: 'erase_fill',
      IconComponent: MCIcon,
      icon: 'content-cut',
    },
    {
      name: 'erase_brush_large',
      IconComponent: EraseIcon,
      size: 22,
    },
    {
      name: 'erase_brush_medium',
      IconComponent: EraseIcon,
      size: 16,
    },
    {
      name: 'erase_brush_small',
      IconComponent: EraseIcon,
      size: 7,
    },
  ],
};

const DrawSubtools = ({ category, value, onChange }) => {
  const subtools = DRAW_SUBTOOLS[category] || [];
  return (
    <View style={styles.toolbar}>
      {subtools.map((tool, ii) => {
        const { name, IconComponent, icon, size } = tool;
        return (
          <Pressable
            key={`subtool-${category}-${ii}`}
            style={makeButtonStyles(value, name)}
            onPress={() => onChange(category, name)}>
            <IconComponent
              name={icon}
              size={size || ICON_SIZE}
              color={makeIconColor(value, name)}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const EraseSubtools = ({ value, onChange }) => {
  const onClearArtwork = () => {
    sendAsync('DRAW_TOOL_CLEAR_ARTWORK');
  };
  return (
    <>
      <DrawSubtools category="artwork_erase" value={value} onChange={onChange} />
      <View style={[styles.toolbar, { marginTop: 8 }]}>
        <Pressable style={styles.button} onPress={onClearArtwork}>
          <MCIcon name="trash-can-outline" size={ICON_SIZE} color="#000" />
        </Pressable>
      </View>
    </>
  );
};

const CollisionEraseSubtools = () => {
  const onClearCollisionShapes = () => {
    sendAsync('DRAW_TOOL_CLEAR_COLLISION_SHAPES');
  };
  return (
    <View style={styles.toolbar}>
      <Pressable style={styles.button} onPress={onClearCollisionShapes}>
        <MCIcon name="trash-can-outline" size={ICON_SIZE} color="#000" />
      </Pressable>
    </View>
  );
  return null;
};

const BitmapMoveSubtools = () => {
  const sendLayerAction = React.useCallback(
    (action, params) => sendAsync('DRAW_TOOL_LAYER_ACTION', { action, ...params }),
    []
  );
  return (
    <>
      <View style={styles.toolbar}>
        <Pressable
          style={styles.button}
          onPress={() => sendLayerAction('scaleBitmapLayer', { doubleValue: 0.05 })}>
          <MCIcon name="arrow-expand-all" size={ICON_SIZE} color="#000" />
        </Pressable>
      </View>
      <View style={[styles.toolbar, { marginTop: 8 }]}>
        <Pressable
          style={styles.button}
          onPress={() => sendLayerAction('scaleBitmapLayer', { doubleValue: -0.05 })}>
          <MCIcon name="arrow-collapse-all" size={ICON_SIZE} color="#000" />
        </Pressable>
      </View>
    </>
  );
  return null;
};

export const OverlayDrawingSubtools = ({ currentToolGroup }) => {
  const drawToolState = useCoreState('EDITOR_DRAW_TOOL');
  const selectSubtool = React.useCallback(
    (category, name) =>
      sendAsync('DRAW_TOOL_SELECT_SUBTOOL', {
        category,
        name,
      }),
    [sendAsync]
  );

  if (!drawToolState) return null;
  const currentSubtool = drawToolState.selectedSubtools[currentToolGroup];

  switch (currentToolGroup) {
    case 'artwork_draw':
    case 'artwork_fill':
    case 'artwork_move':
    case 'collision_draw':
    case 'collision_move':
    case 'bitmap_fill':
    case 'bitmap_erase':
      return (
        <DrawSubtools category={currentToolGroup} value={currentSubtool} onChange={selectSubtool} />
      );
    case 'move_all':
      return <BitmapMoveSubtools />;
    case 'artwork_erase':
      return <EraseSubtools value={currentSubtool} onChange={selectSubtool} />;
    case 'collision_erase':
      return <CollisionEraseSubtools />;
  }
  return null;
};
