import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { sendAsync, useCoreState } from '../../../core/CoreEvents';

import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    paddingLeft: 2,
  },
  image: {
    width: 28,
    aspectRatio: 1,
    flexShrink: 0,
  },
  titleContainer: {
    width: '100%',
    flexShrink: 1,
  },
  title: {
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  titleInput: {
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
});

export const InspectorBlueprintHeader = ({ isEditable }) => {
  const sendInspectorAction = React.useCallback(
    (action, args) => sendAsync('EDITOR_INSPECTOR_ACTION', { action, ...args }),
    []
  );
  const selectedActorData = useCoreState('EDITOR_SELECTED_ACTOR');
  const libraryEntry = selectedActorData?.libraryEntry || { title: '' };

  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [titleInputValue, setTitleInputValue] = React.useState(libraryEntry.title);
  React.useEffect(() => {
    // Stop editing title if the underlying data changed (eg. selected a different actor)
    setIsEditingTitle(false);
  }, [libraryEntry.title]);
  const onStartEditingTitle = React.useCallback(() => {
    setTitleInputValue(libraryEntry.title);
    setIsEditingTitle(true);
  }, [libraryEntry.title]);
  const onEndEditingTitle = React.useCallback(() => {
    if (titleInputValue.length > 0) {
      console.log(`send new title: ${titleInputValue}`);
      sendInspectorAction('updateSelectionTitle', { stringValue: titleInputValue });
    }
    setTimeout(() => setIsEditingTitle(false), 80);
  }, [titleInputValue, sendInspectorAction]);

  return (
    <View style={styles.container}>
      {libraryEntry.base64Png ? (
        <FastImage
          style={styles.image}
          source={{ uri: `data:image/png;base64,${libraryEntry.base64Png}` }}
        />
      ) : null}
      {!isEditingTitle ? (
        <Pressable
          style={styles.titleContainer}
          onPress={onStartEditingTitle}
          disabled={!isEditable}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="middle">
            {libraryEntry.title}
          </Text>
        </Pressable>
      ) : (
        <TextInput
          style={[styles.titleContainer, styles.titleInput]}
          value={titleInputValue}
          onChangeText={(newValue) => setTitleInputValue(newValue)}
          onBlur={onEndEditingTitle}
          autofocus
        />
      )}
    </View>
  );
};
