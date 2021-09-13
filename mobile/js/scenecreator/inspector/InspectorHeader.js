import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { InspectorBlueprintActions } from './InspectorBlueprintActions';
import { InspectorBlueprintHeader } from './components/InspectorBlueprintHeader';
import { SegmentedNavigation } from '../../components/SegmentedNavigation';
import { sendAsync } from '../../core/CoreEvents';

import * as Constants from '../../Constants';
const CastleIcon = Constants.CastleIcon;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  headerLeft: {
    paddingLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginTop: 4,
    borderRadius: 1000,
  },
  closeButton: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  navigation: {
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnWhiteBorder,
  },
});

export const InspectorHeader = ({ isOpen, tabItems, selectedTab, setSelectedTab }) => {
  const sendAction = (action, ...args) => sendAsync('EDITOR_INSPECTOR_ACTION', { action, ...args });

  return (
    <View pointerEvents={isOpen ? 'auto' : 'none'}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <InspectorBlueprintHeader isEditable />
          <InspectorBlueprintActions />
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => sendAction('closeInspector')}>
          <CastleIcon name="close" size={22} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.navigation}>
        <SegmentedNavigation
          style={styles.navigation}
          items={tabItems}
          selectedItem={tabItems.find((i) => i.value === selectedTab)}
          onSelectItem={(item) => setSelectedTab(item.value)}
          isLightBackground
        />
      </View>
    </View>
  );
};
