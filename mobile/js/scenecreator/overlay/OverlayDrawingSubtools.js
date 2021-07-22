import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useCoreState, sendGlobalAction, sendAsync } from '../../core/CoreEvents';

import * as Constants from '../../Constants';

import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  button: {
    height: 36,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: Constants.colors.black,
  },
  eraseIconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const ICON_SIZE = 20;

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
        backgroundColor: 'white',
        borderRadius: size,
        borderWidth: 2,
        borderColor: color,
      }}></View>
  </View>
);

const DRAW_SUBTOOLS = {
  artwork_draw: [
    {
      name: 'pencil_no_grid',
      IconComponent: MaterialIcon,
      icon: 'gesture',
    },
    {
      name: 'line',
      IconComponent: MCIcon,
      icon: 'vector-line',
    },
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
      name: 'erase_small',
      IconComponent: EraseIcon,
      size: 7,
    },
    {
      name: 'erase_medium',
      IconComponent: EraseIcon,
      size: 16,
    },
    {
      name: 'erase_large',
      IconComponent: EraseIcon,
      size: 22,
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
};

const DrawSubtools = ({ category, value, onChange }) => {
  const subtools = DRAW_SUBTOOLS[category] || [];
  return (
    <>
      {subtools.map((tool, ii) => {
        const { name, IconComponent, icon, size } = tool;
        return (
          <Pressable
            key={`subtool-${category}-${ii}`}
            style={[
              ...makeButtonStyles(value, name),
              { borderBottomWidth: ii === subtools.length - 1 ? 0 : 1 },
            ]}
            onPress={() => onChange(category, name)}>
            <IconComponent
              name={icon}
              size={size || ICON_SIZE}
              color={makeIconColor(value, name)}
            />
          </Pressable>
        );
      })}
    </>
  );
};

const EraseSubtools = ({ value, onChange }) => {
  // const onClearArtwork = () => fastAction('onClearArtwork');
  return (
    <>
      {/* TODO: 'clear all artwork' button of some kind */}
      <DrawSubtools category="artwork_erase" value={value} onChange={onChange} />
    </>
  );
};

const CollisionEraseSubtools = () => {
  // const onClearCollisionShapes = () => fastAction('onClearCollisionShapes');
  // TODO: 'clear all collision shapes' button of some kind
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
    case 'artwork_move':
    case 'collision_draw':
    case 'collision_move':
      return (
        <DrawSubtools category={currentToolGroup} value={currentSubtool} onChange={selectSubtool} />
      );
    case 'artwork_erase':
      return <EraseSubtools value={currentSubtool} onChange={selectSubtool} />;
    case 'collision_erase':
      return <CollisionEraseSubtools />;
  }
  return null;
};
