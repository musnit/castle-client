import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useCoreState, sendGlobalAction, sendAsync } from '../../core/CoreEvents';
import { OverlayDrawingSubtools } from './OverlayDrawingSubtools';

import ColorPicker from '../inspector/components/ColorPicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import * as Constants from '../../Constants';

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
  rightContainer: {
    width: 36,
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
    backgroundColor: Constants.colors.white,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    ...Constants.styles.dropShadow,
  },
  button: {
    width: 36,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderColor: Constants.colors.black,
  },
  emptyColorPicker: {
    width: 36,
    height: '100%',
  },
});

const makeButtonStyles = (value, name) => {
  return value == name ? [styles.button, { backgroundColor: '#000' }] : [styles.button];
};

const makeIconColor = (value, name) => {
  return value == name ? '#fff' : '#000';
};

const TOOL_GROUPS = {
  artwork: [
    {
      name: 'artwork_draw',
      IconComponent: MCIcon,
      icon: 'pencil-outline',
    },
    {
      name: 'fill',
      IconComponent: MCIcon,
      icon: 'format-color-fill',
    },
    {
      name: 'artwork_move',
      IconComponent: Icon,
      icon: 'pan-tool',
    },
    {
      name: 'artwork_erase',
      IconComponent: MCIcon,
      icon: 'eraser',
    },
  ],
  collision: [
    {
      name: 'collision_draw',
      IconComponent: MCIcon,
      icon: 'pencil-outline',
    },
    {
      name: 'collision_move',
      IconComponent: Icon,
      icon: 'pan-tool',
    },
    {
      name: 'collision_erase',
      IconComponent: MCIcon,
      name: 'eraser',
    },
  ],
};

const ToolGroups = ({ category, value }) => {
  const onChange = React.useCallback(
    (name) => sendAsync('DRAW_TOOL_SELECT_SUBTOOL', { category, name }),
    [sendAsync, category]
  );
  const groups = TOOL_GROUPS[category];
  return (
    <>
      {groups.map((tool, ii) => {
        const { name, IconComponent, icon } = tool;
        return (
          <Pressable
            key={`toolgroup-${category}-${ii}`}
            style={[
              ...makeButtonStyles(value, name),
              { borderRightWidth: ii === groups.length - 1 ? 0 : 1 },
            ]}
            onPress={() => onChange(name)}>
            <IconComponent name={icon} size={22} color={makeIconColor(value, name)} />
          </Pressable>
        );
      })}
    </>
  );
};

export const OverlayDrawing = () => {
  const drawToolState = useCoreState('EDITOR_DRAW_TOOL');
  if (!drawToolState) return null;

  // TODO
  let fastAction = () => {};

  const rootToolCategory = drawToolState.selectedSubtools.root;
  const currentDrawingToolGroup = drawToolState.selectedSubtools[rootToolCategory];
  const { color } = drawToolState;

  const showColorPicker =
    currentDrawingToolGroup == 'artwork_draw' || currentDrawingToolGroup == 'fill';

  return (
    <>
      <View style={styles.topContainer}>
        <View style={[styles.close, styles.button]}>
          <Pressable onPress={() => sendGlobalAction('useGrabTool')}>
            <Icon name="close" size={28} color="#000" />
          </Pressable>
        </View>
        <View style={styles.toolbar}>
          <ToolGroups category={rootToolCategory} value={currentDrawingToolGroup} />
        </View>
        {showColorPicker ? (
          <View style={styles.toolbar}>
            <View style={styles.button}>
              <ColorPicker
                value={color}
                setValue={(color) => {
                  fastAction('updateColor', color);
                }}
              />
            </View>
          </View>
        ) : (
          <View pointerEvents="none" style={styles.emptyColorPicker} />
        )}
      </View>
      <View style={styles.middleContainer} pointerEvents="box-none">
        <View style={styles.rightContainer}>
          <View style={[styles.toolbar, { flexDirection: 'column' }]}>
            <OverlayDrawingSubtools currentToolGroup={currentDrawingToolGroup} />
          </View>
        </View>
      </View>
    </>
  );
};
