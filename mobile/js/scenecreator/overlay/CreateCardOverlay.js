import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useCardCreator } from '../CreateCardContext';
import { OverlaySelectionActions } from './OverlaySelectionActions';
import { OverlayBlueprint } from './OverlayBlueprint';
import { OverlayDrawing } from './OverlayDrawing';
import { OverlaySound } from './OverlaySound';

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
        <OverlayDrawing setActiveSheet={setActiveSheet} />
      </View>
    );
  } else if (editMode === 'sound') {
    return (
      <View style={styles.container} pointerEvents="box-none">
        <OverlaySound activeSheet={activeSheet} setActiveSheet={setActiveSheet} />
      </View>
    );
  } else {
    // tools for normal scene/grid editing
    if (hasSelection) {
      return (
        <View style={[styles.container, { bottom: beltHeight }]} pointerEvents="box-none">
          {!isBlueprintSelected ? <OverlaySelectionActions /> : <View />}
          {!activeSheet.default ? <OverlayBlueprint /> : null}
        </View>
      );
    }
  }
  return null;
};
