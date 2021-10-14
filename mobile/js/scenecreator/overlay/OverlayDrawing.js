import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useCoreState, sendGlobalAction, sendAsync } from '../../core/CoreEvents';
import { OverlayDrawingSubtools } from './OverlayDrawingSubtools';

import ColorPicker from '../inspector/components/ColorPicker';

import * as Constants from '../../Constants';
const CastleIcon = Constants.CastleIcon;

const styles = StyleSheet.create({
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 36,
  },
  middleContainer: {
    marginTop: 8,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  close: {
    borderRadius: 6,
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    ...Constants.styles.dropShadow,
  },
  toolbar: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    ...Constants.styles.dropShadow,
  },
  button: {
    width: 36,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const makeButtonStyles = (value, name) => {
  return value === name ? [styles.button, { backgroundColor: '#000' }] : [styles.button];
};

const makeIconColor = (value, name) => {
  return value === name ? '#fff' : '#000';
};

const TOOL_GROUPS = {
  artwork: [
    {
      name: 'artwork_draw',
      IconComponent: CastleIcon,
      icon: 'draw',
    },
    {
      name: 'fill',
      IconComponent: CastleIcon,
      icon: 'fill',
    },
    {
      name: 'artwork_move',
      IconComponent: CastleIcon,
      icon: 'grab',
    },
    {
      name: 'artwork_erase',
      IconComponent: CastleIcon,
      icon: 'erase',
    },
  ],
  collision: [
    {
      name: 'collision_draw',
      IconComponent: CastleIcon,
      icon: 'draw',
    },
    {
      name: 'collision_move',
      IconComponent: CastleIcon,
      icon: 'grab',
    },
    {
      name: 'collision_erase',
      IconComponent: CastleIcon,
      icon: 'erase',
    },
  ],
};

const ToolGroups = ({ category, value }) => {
  const onChange = React.useCallback(
    (name) => sendAsync('DRAW_TOOL_SELECT_SUBTOOL', { category, name }),
    [category]
  );
  const groups = TOOL_GROUPS[category];
  return (
    <>
      {groups.map((tool, ii) => {
        const { name, IconComponent, icon } = tool;
        return (
          <Pressable
            key={`toolgroup-${category}-${ii}`}
            style={makeButtonStyles(value, name)}
            onPress={() => onChange(name)}>
            <IconComponent name={icon} size={22} color={makeIconColor(value, name)} />
          </Pressable>
        );
      })}
    </>
  );
};

export const OverlayDrawing = () => {
  const drawToolState = useCoreState('EDITOR_DRAW_TOOL') || {};

  // for david to experiment with grid settings
  // TODO: remove
  React.useEffect(() => {
    sendAsync('DRAW_TOOL_TEMP_GRID_SETTINGS', {
      backgroundColor: [0.8, 0.8, 0.8, 1],
      gridColor: [0, 0, 0, 0.4],
      axisColor: [1, 1, 1, 1],
      gridDotRadius: 3.5,
      isGridForeground: false,
    });
  }, []);

  const setViewInContext = React.useCallback(
    (enabled) => sendAsync('DRAW_TOOL_VIEW_IN_CONTEXT', { enabled }),
    []
  );

  if (!drawToolState.selectedSubtools) return null;

  const rootToolCategory = drawToolState.selectedSubtools.root;
  const currentDrawingToolGroup = drawToolState.selectedSubtools[rootToolCategory];
  const { color } = drawToolState;

  const showColorPicker =
    currentDrawingToolGroup === 'artwork_draw' || currentDrawingToolGroup === 'fill';

  return (
    <>
      <View style={styles.topContainer}>
        <View style={[styles.close, styles.button]}>
          <Pressable onPress={() => sendGlobalAction('setMode', 'default')}>
            <CastleIcon name="close" size={22} color="#000" />
          </Pressable>
        </View>
        <View style={styles.toolbar}>
          <ToolGroups category={rootToolCategory} value={currentDrawingToolGroup} />
        </View>
        <View style={styles.toolbar}>
          <Pressable
            style={styles.button}
            onPressIn={() => setViewInContext(true)}
            onPressOut={() => setViewInContext(false)}>
            <CastleIcon name="view-context" size={22} />
          </Pressable>
        </View>
      </View>
      <View style={styles.middleContainer} pointerEvents="box-none">
        <View style={styles.rightContainer}>
          {showColorPicker ? (
            <View style={[styles.toolbar, { marginBottom: 8 }]}>
              <View style={styles.button}>
                <ColorPicker
                  value={color}
                  setValue={(color) => {
                    sendAsync('DRAW_TOOL_SELECT_COLOR', { color });
                  }}
                />
              </View>
            </View>
          ) : null}
          <OverlayDrawingSubtools currentToolGroup={currentDrawingToolGroup} />
        </View>
      </View>
    </>
  );
};
