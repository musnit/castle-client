import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, TextInput } from 'react-native';
import { InspectorBlueprintActions } from './InspectorBlueprintActions';
import { SegmentedNavigation } from '../../components/SegmentedNavigation';
import { sendAsync } from '../../core/CoreEvents';

import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import * as Constants from '../../Constants';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnWhiteBorder,
  },
  titleContainer: {
    flex: 1,
  },
  titleTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleInput: {
    fontSize: 20,
    flex: 1,
    color: 'black',
  },
  title: {
    fontSize: 20,
  },
});

export const InspectorHeader = ({ isOpen, tabItems, selectedTab, setSelectedTab }) => {
  // TODO: new engine data
  const data = {}; // previously `inspectorActions`
  const sendAction = (action, ...args) => sendAsync('EDITOR_INSPECTOR_ACTION', { action, ...args });

  const safeTitle = data.title ?? '';
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [titleInputValue, setTitleInputValue] = React.useState('');
  React.useEffect(() => {
    // Stop editing title if the underlying data changed (eg. selected a different actor)
    setIsEditingTitle(false);
  }, [safeTitle]);
  const onStartEditingTitle = React.useCallback(() => {
    setTitleInputValue(safeTitle);
    setIsEditingTitle(true);
  }, [safeTitle]);
  const onEndEditingTitle = React.useCallback(() => {
    if (titleInputValue.length > 0) {
      sendAction('setTitle', titleInputValue);
    }
    setTimeout(() => setIsEditingTitle(false), 80);
  }, [titleInputValue]);

  if (data) {
    return (
      <View pointerEvents={isOpen ? 'auto' : 'none'}>
        <View style={styles.header}>
          {safeTitle.length > 0 ? (
            <View style={styles.titleContainer}>
              {!isEditingTitle ? (
                <TouchableOpacity
                  style={styles.titleTouchable}
                  onPress={onStartEditingTitle}
                  activeOpacity={1}>
                  <Text style={styles.title} numberOfLines={1} ellipsizeMode="middle">
                    {safeTitle}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TextInput
                  style={styles.titleInput}
                  value={titleInputValue}
                  onChangeText={(newValue) => setTitleInputValue(newValue)}
                  onBlur={onEndEditingTitle}
                  autoFocus
                />
              )}
            </View>
          ) : null}
          <InspectorBlueprintActions />
          <TouchableOpacity style={styles.closeButton} onPress={() => sendAction('closeInspector')}>
            <Icon name="close" size={32} color="#000" />
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
  }
  return null;
};
