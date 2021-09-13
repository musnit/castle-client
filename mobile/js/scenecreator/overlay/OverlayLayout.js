import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCoreState } from '../../core/CoreEvents';

import FeatherIcon from 'react-native-vector-icons/Feather';

import * as Constants from '../../Constants';
import * as SceneCreatorConstants from '../SceneCreatorConstants';

const styles = StyleSheet.create({
  container: {
    borderRadius: SceneCreatorConstants.OVERLAY_BORDER_RADIUS,
    borderColor: '#000',
    borderWidth: 1,
    backgroundColor: '#fff',
    width: '100%',
    marginBottom: 8,
    padding: 8,
    paddingLeft: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  behaviorName: {
    fontSize: 14,
    letterSpacing: 0.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  componentPreview: {
    flexDirection: 'row',
  },
  componentPreviewText: {
    fontSize: 14,
    color: '#888',
    marginRight: 12,
  },
  editButton: {
    ...SceneCreatorConstants.styles.boxShadow,
    width: 26,
    aspectRatio: 1,
    borderRadius: 26,
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const OverlayLayout = ({ setActiveSheet }) => {
  const component = useCoreState('EDITOR_SELECTED_COMPONENT:Body');
  if (!component) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.behaviorName}>Layout</Text>
      <View style={styles.right}>
        <View style={styles.componentPreview}>
          <Text style={styles.componentPreviewText}>X: {component.props.x}</Text>
          <Text style={styles.componentPreviewText}>Y: {component.props.y}</Text>
          <Text style={styles.componentPreviewText}>W: {component.props.widthScale}</Text>
          <Text style={styles.componentPreviewText}>H: {component.props.heightScale}</Text>
        </View>
        <Pressable style={styles.editButton} onPress={() => setActiveSheet('sceneCreatorInstance')}>
          <FeatherIcon name="edit-2" size={14} />
        </Pressable>
      </View>
    </View>
  );
};
