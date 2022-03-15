import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../../components/AppText';
import { InspectorBlueprintHeader } from '../inspector/components/InspectorBlueprintHeader';
import { sendAsync } from '../../core/CoreEvents';

import * as SceneCreatorConstants from '../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {
    borderRadius: SceneCreatorConstants.OVERLAY_BORDER_RADIUS,
    borderColor: '#000',
    borderWidth: 1,
    backgroundColor: '#fff',
    width: '100%',
    padding: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export const OverlayBlueprint = () => {
  const sendInspectorAction = (action, ...args) =>
    sendAsync('EDITOR_INSPECTOR_ACTION', { action, ...args });
  return (
    <View style={styles.container}>
      <InspectorBlueprintHeader />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          style={[SceneCreatorConstants.styles.button, { marginLeft: 6 }]}
          onPress={() => sendInspectorAction('openInspector')}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>Edit Blueprint</Text>
        </Pressable>
      </View>
    </View>
  );
};
