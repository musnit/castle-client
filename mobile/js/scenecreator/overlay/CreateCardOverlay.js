import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useCardCreator } from '../CreateCardContext';
import { OverlaySelectionActions } from './OverlaySelectionActions';
import { OverlayBlueprint } from './OverlayBlueprint';
import { OverlayDrawing } from './OverlayDrawing';
import { OverlayLayout } from './OverlayLayout';

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

export const CreateCardOverlay = ({ activeSheet, setActiveSheet, isShowingDraw, beltHeight }) => {
  const { hasSelection } = useCardCreator();
  if (isShowingDraw) {
    return (
      <View style={styles.container} pointerEvents="box-none">
        <OverlayDrawing />
      </View>
    );
  } else {
    // tools for normal scene/grid editing
    if (hasSelection && !activeSheet) {
      return (
        <View style={[styles.container, { bottom: beltHeight }]} pointerEvents="box-none">
          <OverlaySelectionActions />
          <View pointerEvents="box-none">
            <OverlayLayout setActiveSheet={setActiveSheet} />
            <OverlayBlueprint />
          </View>
        </View>
      );
    }
  }
  return null;
};
