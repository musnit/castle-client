import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { SegmentedNavigation } from '../../components/SegmentedNavigation';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useCardCreator } from '../CreateCardContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import * as Constants from '../../Constants';
import * as Clipboard from '../LibraryEntryClipboard';

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

const makeChangeOrderOptions = ({ isTextActorSelected, sendAction }) => {
  if (isTextActorSelected) {
    return [
      {
        name: 'Move to Top',
        action: () => sendAction('moveSelectionToBack'),
      },
      {
        name: 'Move Up',
        action: () => sendAction('moveSelectionBackward'),
      },
      {
        name: 'Move Down',
        action: () => sendAction('moveSelectionForward'),
      },
      {
        name: 'Move to Bottom',
        action: () => sendAction('moveSelectionToFront'),
      },
    ];
  } else {
    return [
      {
        name: 'Bring to Front',
        action: () => sendAction('moveSelectionToFront'),
      },
      {
        name: 'Bring Forward',
        action: () => sendAction('moveSelectionForward'),
      },
      {
        name: 'Send Backward',
        action: () => sendAction('moveSelectionBackward'),
      },
      {
        name: 'Send to Back',
        action: () => sendAction('moveSelectionToBack'),
      },
    ];
  }
};

export const InspectorHeader = ({ isOpen, tabItems, selectedTab, setSelectedTab }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const {
    inspectorActions: data,
    sendInspectorAction: sendAction,
    applicableTools,
    isTextActorSelected,
  } = useCardCreator();

  const changeSelectionOrder = React.useCallback(() => {
    const options = makeChangeOrderOptions({ isTextActorSelected, sendAction });
    showActionSheetWithOptions(
      {
        title: 'Change order',
        options: options.map((option) => option.name).concat(['Cancel']),
        cancelButtonIndex: options.length,
      },
      (buttonIndex) => {
        if (buttonIndex < options.length) {
          return options[buttonIndex].action();
        }
      }
    );
  }, [sendAction]);

  const safeTitle = data ? data.title : '';
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

  const copyBlueprint = React.useCallback(() => {
    Clipboard.copySelectedBlueprint();
  }, []);

  if (data) {
    let scaleRotateButton;

    if (!data.isBlueprint && applicableTools) {
      const grabBehavior = applicableTools.find((behavior) => behavior.name === 'Grab');
      const scaleRotateBehavior = applicableTools.find(
        (behavior) => behavior.name === 'ScaleRotate'
      );

      if (scaleRotateBehavior) {
        const isScaleRotatedSelected = data.activeToolBehaviorId === scaleRotateBehavior.behaviorId;
        const onPress = () =>
          sendAction(
            'setActiveTool',
            isScaleRotatedSelected ? grabBehavior.behaviorId : scaleRotateBehavior.behaviorId
          );
        scaleRotateButton = (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: isScaleRotatedSelected ? '#000' : '#fff' },
            ]}
            onPress={onPress}>
            <Icon name="crop-rotate" size={22} color={isScaleRotatedSelected ? '#fff' : '#000'} />
          </TouchableOpacity>
        );
      }
    }

    return (
      <View pointerEvents={isOpen ? 'auto' : 'none'}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => sendAction('closeInspector')}>
            <Icon name="close" size={32} color="#000" />
          </TouchableOpacity>
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
          <View style={styles.actions}>
            {scaleRotateButton}
            {!data.isBlueprint ? (
              <TouchableOpacity style={styles.actionButton} onPress={changeSelectionOrder}>
                {isTextActorSelected ? (
                  <Icon name="swap-vert" size={24} color="#000" />
                ) : (
                  <FeatherIcon name="layers" size={22} color="#000" />
                )}
              </TouchableOpacity>
            ) : null}
            {true || data.isBlueprint ? ( // Leaving this here to allow skipping actor duplicate button...
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => sendAction('duplicateSelection')}>
                {data.isBlueprint ? (
                  <MCIcon
                    name="source-fork"
                    size={22}
                    color="#000"
                    style={{ transform: [{ rotate: '90deg' }] }}
                  />
                ) : (
                  <FeatherIcon name="copy" size={22} color="#000" />
                )}
              </TouchableOpacity>
            ) : null}
            {data.isBlueprint ? (
              <TouchableOpacity style={styles.actionButton} onPress={() => copyBlueprint()}>
                <FeatherIcon name="copy" size={22} color="#000" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => sendAction('deleteSelection')}>
              <FeatherIcon name="trash-2" size={22} color="#000" />
            </TouchableOpacity>
          </View>
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
