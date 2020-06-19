import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CardCreatorBottomSheet from './CardCreatorBottomSheet';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  back: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headingContainer: {
    width: '100%',
    height: '100%',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -54, // required to center properly with back button
    zIndex: -1, // required to prevent negative margin from blocking back button
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

export default BlueprintsSheet = ({ element, isOpen, onClose, context }) => {
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.back} onPress={onClose}>
        <Icon name="close" size={32} color="#000" />
      </TouchableOpacity>
      <View style={styles.headingContainer}>
        <Text style={styles.headingLabel}>Blueprints</Text>
      </View>
    </View>
  );

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      element={element}
      context={context}
      renderHeader={renderHeader}
    />
  );
};
