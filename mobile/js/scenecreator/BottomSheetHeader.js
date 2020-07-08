import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  done: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderRadius: 3,
    borderColor: '#000',
    width: 54,
  },
  doneText: {
    fontWeight: 'bold',
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
    paddingVertical: 16,
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
