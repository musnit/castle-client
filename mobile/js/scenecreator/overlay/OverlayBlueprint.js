import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InspectorBlueprintActions } from '../inspector/InspectorBlueprintActions';
import { sendAsync } from '../../core/CoreEvents';

const styles = StyleSheet.create({
  container: {
    height: 36,
    borderRadius: 6,
    borderColor: '#000',
    borderWidth: 1,
    backgroundColor: '#fff',
    width: '100%',
    marginBottom: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  behaviorName: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  editButton: {
    borderColor: '#000',
    borderWidth: 1,
    borderBottomWidth: 1.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editLabel: {
    fontSize: 12,
  },
});

export const OverlayBlueprint = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.behaviorName}>Blueprint</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <InspectorBlueprintActions />
        <Pressable style={styles.editButton} onPress={() => sendAsync('SELECT_BLUEPRINT')}>
          <Text style={styles.editLabel}>Edit</Text>
        </Pressable>
      </View>
    </View>
  );
};
