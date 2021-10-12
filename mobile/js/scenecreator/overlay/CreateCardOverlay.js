import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useCardCreator } from '../CreateCardContext';
import { OverlaySelectionActions } from './OverlaySelectionActions';
import { OverlayBlueprint } from './OverlayBlueprint';
import { OverlayDrawing } from './OverlayDrawing';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    padding: 8,
    justifyContent: 'space-between',
  },
});

export const CreateCardOverlay = ({ activeSheet, setActiveSheet, editMode, beltHeight }) => {
  const { isPlaying, hasSelection, isBlueprintSelected } = useCardCreator();
  if (isPlaying) {
    return null;
  }

  if (editMode === 'draw') {
    return (
      <View style={styles.container} pointerEvents="box-none">
        <OverlayDrawing />
      </View>
    );
  } else {
    // tools for normal scene/grid editing
    // TODO: setActiveSheet('sceneCreatorInstance') opens layout sheet
    if (hasSelection && !activeSheet) {
      return (
        <View style={[styles.container, { bottom: beltHeight }]} pointerEvents="box-none">
          {!isBlueprintSelected ? <OverlaySelectionActions /> : <View />}
          <View pointerEvents="box-none">
            <OverlayBlueprint />
          </View>
        </View>
      );
    }
  }
  return null;
};
