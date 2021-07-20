import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useCardCreator } from '../CreateCardContext';
import { OverlaySelectionActions } from './OverlaySelectionActions';
import { OverlayLayout } from './OverlayLayout';
import { OverlayBlueprint } from './OverlayBlueprint';

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
    // TODO: draw overlay tools
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
