import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { BottomSheet } from '../components/BottomSheet';
import { SegmentedNavigation } from '../components/SegmentedNavigation';
import { useCardCreator } from './CreateCardContext';

import DeckVariables from '../DeckVariables';
import SceneBackups from './SceneBackups';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
  },
  headerTabsRow: {
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

const TAB_ITEMS = [
  {
    name: 'Variables',
    value: 'variables',
  },
  {
    name: 'Backups',
    value: 'backups',
  },
];

const CardToolsSheet = ({ onClose, ...props }) => {
  const { card, variables, onVariablesChange: onChange, onSelectBackupData } = useCardCreator();
  const cardId = card?.cardId;

  const [mode, setMode] = React.useState('variables');

  // TODO: memo
  const renderContent =
    mode === 'variables'
      ? () => <DeckVariables variables={variables} onChange={onChange} />
      : () => <SceneBackups cardId={cardId} onSelectSceneData={onSelectBackupData} />;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <TouchableOpacity style={styles.back} onPress={onClose}>
          <Icon name="close" size={32} color="#000" />
        </TouchableOpacity>
        <View style={styles.headingContainer}>
          <Text style={styles.headingLabel}>Tools</Text>
        </View>
      </View>
      <View style={styles.headerTabsRow}>
        <SegmentedNavigation
          items={TAB_ITEMS}
          onSelectItem={(item) => setMode(item.value)}
          selectedItem={TAB_ITEMS.find((item) => item.value === mode)}
          isLightBackground
        />
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

export default CardToolsSheet;
