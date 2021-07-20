import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCoreState } from '../../core/CoreEvents';

import MCIcon from 'react-native-vector-icons/MaterialIcons';

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
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  behaviorName: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  componentPreviewText: {
    fontSize: 14,
    color: '#888',
  },
  editButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderColor: '#000',
    borderWidth: 1,
    borderBottomWidth: 1.5,
    marginLeft: 12,
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
        <Text style={styles.componentPreviewText}>
          X: {component.props.x} Y: {component.props.y} W: {component.props.widthScale} H:{' '}
          {component.props.heightScale}
        </Text>
        <Pressable style={styles.editButton} onPress={() => setActiveSheet('sceneCreatorInstance')}>
          <MCIcon name="edit" size={16} />
        </Pressable>
      </View>
    </View>
  );
};
