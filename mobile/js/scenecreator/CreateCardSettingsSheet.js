import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useGhostUI } from '../ghost/GhostUI';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { BottomSheet } from '../BottomSheet';
import { ToolPane } from '../Tools';

const SETTINGS_PANE_KEY = 'sceneCreatorSettings';

import BottomSheetHeader from './BottomSheetHeader';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    padding: 8,
  },
});

const CreateCardSettings = ({ isShowingTextActors, setShowingTextActors }) => {
  const { root } = useGhostUI();

  let settingsPane;
  if (root && root.panes && root.panes[SETTINGS_PANE_KEY]) {
    settingsPane = <ToolPane element={root.panes[SETTINGS_PANE_KEY]} style={{ padding: 8 }} />;
  }

  return (
    <View>
      <View style={styles.settingsRow}>
        <Switch
          value={isShowingTextActors}
          onValueChange={setShowingTextActors}
          style={{ marginRight: 8 }}
        />
        <Text>Show text actors</Text>
      </View>
      {settingsPane}
    </View>
  );
};

const CreateCardSettingsSheet = ({ onClose, context, ...props }) => {
  const { isShowingTextActors, setShowingTextActors } = context;

  const renderHeader = () => <BottomSheetHeader title="Layout" onClose={onClose} />;
  const renderContent = () => (
    <CreateCardSettings
      isShowingTextActors={isShowingTextActors}
      setShowingTextActors={setShowingTextActors}
    />
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
