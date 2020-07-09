import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import * as SceneCreatorConstants from './SceneCreatorConstants';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  back: {
    flexShrink: 0,
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  done: {
    ...SceneCreatorConstants.styles.button,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    width: 60,
  },
  doneText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  headingContainer: {
    width: '100%',
    height: '100%',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerHeading: {
    zIndex: -1, // required to prevent negative margin from blocking back button
    marginLeft: -54, // required to center properly with back button
  },
  headingLabel: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
    width: '100%',
    textAlign: 'center',
  },
});

export default BottomSheetHeader = ({ title, onClose, onDone }) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.back} onPress={onClose}>
      <Icon name="close" size={32} color="#000" />
    </TouchableOpacity>
    <View style={[styles.headingContainer, onDone ? null : styles.centerHeading]}>
      <Text style={styles.headingLabel}>{title}</Text>
    </View>
    {onDone && (
      <TouchableOpacity style={styles.done} onPress={onDone}>
        <Text style={styles.doneText}>Done</Text>
      </TouchableOpacity>
    )}
  </View>
);
