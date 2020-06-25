import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useGhostUI } from '../ghost/GhostUI';
import { sendDataPaneAction } from '../Tools';

import BottomSheetHeader from './BottomSheetHeader';
import CardCreatorBottomSheet from './CardCreatorBottomSheet';

const styles = StyleSheet.create({
  form: {
    padding: 16,
  },
  label: {
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderTopWidth: 2,
    borderRadius: 3,
    borderColor: '#000',
    padding: 8,
    marginBottom: 8,
    color: '#000',
  },
});

const SaveBlueprintForm = ({ library, saveBlueprintData, sendAction }) => {
  const [title, setTitle] = React.useState(saveBlueprintData.title);
  const [description, setDescription] = React.useState(saveBlueprintData.description);

  // TODO: check library for saveBlueprintData.entryId to determine if there's an existing one
  // TODO: show 'update existing' if so
  // TODO: show 'save new' button either way
  return (
    <View style={styles.form}>
      <Text style={styles.label}>Title</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} />
      <Text style={styles.label}>Description</Text>
      <TextInput value={description} onChangeText={setDescription} style={styles.input} />
    </View>
  );
};

export default SaveBlueprintSheet = ({ isOpen, onClose, context }) => {
  let data, sendAction;

  const { root } = useGhostUI();
  const element = root?.panes ? root.panes['sceneCreatorBlueprints'] : null;
  if (element?.children.count) {
    Object.entries(element.children).forEach(([key, child]) => {
      if (child.type === 'data') {
        data = child.props.data;
        data.lastReportedEventId = child.lastReportedEventId;
        sendAction = (action, value) => sendDataPaneAction(element, action, value, key);
      }
    });
  }

  const renderHeader = () => <BottomSheetHeader title="Save blueprint" onClose={onClose} />;

  const renderContent = () => {
    if (!data) return <View />;

    return (
      <SaveBlueprintForm
        library={data.library}
        saveBlueprintData={data.saveBlueprintData}
        sendAction={sendAction}
      />
    );
  };

  return (
    <CardCreatorBottomSheet
      isOpen={isOpen}
      context={context}
      renderHeader={renderHeader}
      renderContent={renderContent}
    />
  );
};
