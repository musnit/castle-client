import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { BottomSheet } from '../BottomSheet';

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
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    padding: 8,
  },
});

const CreateCardSettings = ({ isShowingTextActors, onShowTextActors }) => {
  return (
    <View>
      <View style={styles.settingsRow}>
        <Switch
          value={isShowingTextActors}
          onValueChange={onShowTextActors}
          style={{ marginRight: 8 }}
        />
        <Text>Show text actors</Text>
      </View>
    </View>
  );
};

const CreateCardSettingsSheet = ({ onClose, isShowingTextActors, onShowTextActors, ...props }) => {
  const renderContent = () => (
    <CreateCardSettings
      isShowingTextActors={isShowingTextActors}
      onShowTextActors={onShowTextActors}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.back} onPress={onClose}>
        <Icon name="close" size={32} color="#000" />
      </TouchableOpacity>
      <View style={styles.headingContainer}>
        <Text style={styles.headingLabel}>Layout</Text>
      </View>
    </View>
  );

  return (
    <BottomSheet
      renderContent={renderContent}
      renderHeader={renderHeader}
      style={styles.container}
      {...props}
    />
  );
};

export default CreateCardSettingsSheet;
