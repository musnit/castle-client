import React from 'react';
import { ActivityIndicator, StyleSheet, Pressable, Text, View } from 'react-native';
import { BottomSheet } from '../../components/BottomSheet';
import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import { InspectorNumberInput } from '../inspector/components/InspectorNumberInput';
import { useCoreState, sendAsync } from '../../core/CoreEvents';

import * as Constants from '../../Constants';
import * as SceneCreatorConstants from '../SceneCreatorConstants';

import Feather from 'react-native-vector-icons/Feather';

const USE_TEST_UI = false;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#000',
  },
  importSettings: {
    paddingTop: 16,
    paddingHorizontal: 16,
    maxWidth: Constants.TABLET_MAX_FORM_WIDTH,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  label: {
    fontSize: 16,
    paddingRight: 8,
  },
});

const testStyles = StyleSheet.create({
  importSettings: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
  },
  label: {
    fontSize: 16,
    paddingRight: 12,
  },
});

const TestImportImage = ({ importData, sendAction }) => {
  if (!importData) {
    return null;
  }
  if (importData.loading) {
    return (
      <View style={testStyles.importSettings}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <View style={testStyles.importSettings}>
      <View style={testStyles.row}>
        <View>
          <Text style={testStyles.label}>Pre-blur (0-3, more is slower)</Text>
        </View>
        <InspectorNumberInput
          style={{ maxWidth: '40%' }}
          onChange={(value) => sendAction('setNumBlurs', { value })}
          value={importData.numBlurs}
          min={0}
          max={3}
        />
      </View>
      <View style={testStyles.row}>
        <View>
          <Text style={testStyles.label}>Number of colors (2-8)</Text>
        </View>
        <InspectorNumberInput
          style={{ maxWidth: '40%' }}
          onChange={(value) => sendAction('setNumColors', { value })}
          value={importData.numColors}
          min={2}
          max={8}
        />
      </View>
      <View style={testStyles.row}>
        <View>
          <Text style={testStyles.label}>Minimum equal neighbors</Text>
        </View>
        <InspectorNumberInput
          style={{ maxWidth: '40%' }}
          onChange={(value) => sendAction('setMinEqualNeighbors', { value })}
          value={importData.minEqualNeighbors}
          min={0}
          max={3}
        />
      </View>
      <View style={testStyles.row}>
        <View>
          <Text style={testStyles.label}>Scale</Text>
        </View>
        <InspectorNumberInput
          style={{ maxWidth: '40%' }}
          onChange={(value) => sendAction('setImageScale', { value })}
          value={importData.imageScale}
          step={0.05}
          min={0.05}
          max={1}
        />
      </View>
      <View style={testStyles.row}>
        <Pressable
          style={SceneCreatorConstants.styles.button}
          onPress={() => sendAction('swapColors', { value: 1 })}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>
            New colors (similar luminance)
          </Text>
        </Pressable>
      </View>
      <View style={testStyles.row}>
        <Pressable
          style={SceneCreatorConstants.styles.button}
          onPress={() => sendAction('swapColors', { value: 0 })}>
          <Text style={SceneCreatorConstants.styles.buttonLabel}>New colors (full random)</Text>
        </Pressable>
      </View>
    </View>
  );
};

const ImportImage = ({ importData, sendAction }) => {
  if (!importData) {
    return null;
  }
  if (importData.loading) {
    return (
      <View style={styles.importSettings}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <View style={styles.importSettings}>
      <View style={styles.row}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.label}>Colors</Text>
          <Pressable
            style={[SceneCreatorConstants.styles.button, {}]}
            onPress={() => sendAction('swapColors', { value: 1 })}>
            <Feather name="refresh-cw" size={18} />
          </Pressable>
        </View>
        <InspectorNumberInput
          style={{ maxWidth: 128 }}
          onChange={(value) => sendAction('setNumColors', { value })}
          value={importData.numColors}
          min={2}
          max={5}
        />
      </View>
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Input Scale</Text>
        </View>
        <InspectorNumberInput
          style={{ maxWidth: 128 }}
          onChange={(value) => sendAction('setImageScale', { value })}
          value={importData.imageScale}
          step={0.05}
          min={0.05}
          max={1}
        />
      </View>
    </View>
  );
};

export const DrawingImportImageSheet = ({ isOpen, ...props }) => {
  const importData = useCoreState('EDITOR_IMPORT_IMAGE');
  const sendImportAction = React.useCallback(
    (action, params) => sendAsync('IMPORT_IMAGE_ACTION', { action, ...params }),
    []
  );
  const cancelImport = React.useCallback(
    () => sendAsync('DRAW_TOOL_LAYER_ACTION', { action: 'cancelImportImage' }),
    []
  );
  const confirmImport = React.useCallback(
    () => sendAsync('DRAW_TOOL_LAYER_ACTION', { action: 'confirmImportImage' }),
    []
  );

  const renderHeader = () => (
    <BottomSheetHeader
      title="Import Image"
      onClose={cancelImport}
      onDone={confirmImport}
      loading={importData?.loading}
    />
  );
  const Component = USE_TEST_UI ? TestImportImage : ImportImage;
  const renderContent = () =>
    !isOpen ? null : <Component sendAction={sendImportAction} importData={importData} />;

  return (
    <BottomSheet
      isOpen={isOpen}
      initialSnap={1}
      renderContent={renderContent}
      renderHeader={renderHeader}
      style={styles.container}
      {...props}
    />
  );
};
