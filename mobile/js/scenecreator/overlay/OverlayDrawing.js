import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useCoreState, sendGlobalAction, sendAsync } from '../../core/CoreEvents';

import ColorPicker from '../inspector/components/ColorPicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import * as Constants from '../../Constants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 36,
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
});

const ArtworkTools = ({ currentDrawingToolGroup }) => {
  const selectSubtool = React.useCallback(
    (name) => sendAsync('DRAW_TOOL_SELECT_SUBTOOL', { category: 'artwork', name }),
    [sendAsync]
  );
  return (
    <>
      <Pressable style={styles.button} onPress={() => selectSubtool('artwork_draw')}>
        <MCIcon
          name="pencil-outline"
          size={22}
          color={currentDrawingToolGroup == 'artwork_draw' ? '#fff' : '#000'}
        />
      </Pressable>
      <Pressable style={styles.button} onPress={() => selectSubtool('fill')}>
        <MCIcon
          name="format-color-fill"
          size={22}
          color={currentDrawingToolGroup == 'fill' ? '#fff' : '#000'}
        />
      </Pressable>
      <Pressable style={styles.button} onPress={() => selectSubtool('artwork_move')}>
        <Icon
          name="pan-tool"
          size={18}
          color={currentDrawingToolGroup == 'artwork_move' ? '#fff' : '#000'}
        />
      </Pressable>
      <Pressable style={styles.button} onPress={() => selectSubtool('artwork_erase')}>
        <MCIcon
          name="eraser"
          size={22}
          color={currentDrawingToolGroup == 'artwork_erase' ? '#fff' : '#000'}
        />
      </Pressable>
    </>
  );
};

const CollisionTools = ({ currentDrawingToolGroup }) => {
  const selectSubtool = React.useCallback(
    (name) => sendAsync('DRAW_TOOL_SELECT_SUBTOOL', { category: 'collision', name }),
    [sendAsync]
  );
  return (
    <>
      <Pressable style={styles.button} onPress={() => selectSubtool('collision_draw')}>
        <MCIcon
          name="pencil-outline"
          size={22}
          color={currentDrawingToolGroup == 'collision_draw' ? '#fff' : '#000'}
        />
      </Pressable>
      <Pressable style={styles.button} onPress={() => selectSubtool('collision_move')}>
        <Icon
          name="pan-tool"
          size={18}
          color={currentDrawingToolGroup == 'collision_move' ? '#fff' : '#000'}
        />
      </Pressable>
      <Pressable style={styles.button} onPress={() => selectSubtool('collision_erase')}>
        <MCIcon
          name="eraser"
          size={22}
          color={currentDrawingToolGroup == 'collision_erase' ? '#fff' : '#000'}
        />
      </Pressable>
    </>
  );
};

export const OverlayDrawing = () => {
  const drawToolState = useCoreState('EDITOR_DRAW_TOOL');

  // TODO
  let fastAction = () => {};

  // TODO: proper drawToolState
  /* const isArtworkActive = drawToolState.selectedSubtools.root == 'artwork';
  const currentDrawingToolGroup = isArtworkActive
    ? drawToolState.selectedSubtools.artwork
    : drawToolState.selectedSubtools.collision;
const { color } = drawToolState;  */
  const isArtworkActive = true;
  const currentDrawingToolGroup = 'artwork_draw';
  const color = [0, 0, 0];

  // TODO: to swap between artwork and collision:
  // sendAsync('DRAW_TOOL_SELECT_SUBTOOL', { category: 'root', name: item.value })

  const showColorPicker =
    currentDrawingToolGroup == 'artwork_draw' || currentDrawingToolGroup == 'fill';

  return (
    <View style={styles.container}>
      <View style={[styles.close, styles.button]}>
        <Pressable onPress={() => sendGlobalAction('useGrabTool')}>
          <Icon name="close" size={28} color="#000" />
        </Pressable>
      </View>
      <View style={styles.toolbar}>
        {isArtworkActive ? (
          <ArtworkTools currentDrawingToolGroup={currentDrawingToolGroup} />
        ) : (
          <CollisionTools currentDrawingToolGroup={currentDrawingToolGroup} />
        )}
      </View>
      <View style={styles.toolbar}>
        {showColorPicker ? (
          <View style={styles.button}>
            <ColorPicker
              value={color}
              setValue={(color) => {
                fastAction('updateColor', color);
              }}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
};
