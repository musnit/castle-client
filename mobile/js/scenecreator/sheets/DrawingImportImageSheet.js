import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '../../components/BottomSheet';
import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import { InspectorNumberInput } from '../inspector/components/InspectorNumberInput';
import { useCoreState, sendAsync } from '../../core/CoreEvents';

import * as Constants from '../../Constants';

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

const ImportImage = ({ importData, sendAction }) => {
  if (!importData) {
    return null;
  }
  return (
    <View style={styles.importSettings}>
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Number of colors</Text>
        </View>
        <InspectorNumberInput
          style={{ maxWidth: '25%' }}
          onChange={(value) => sendAction('setNumColors', { value })}
          value={importData.numColors}
          min={2}
          max={8}
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

  // TODO: done
  const renderHeader = () => <BottomSheetHeader title="Import Image" onClose={cancelImport} />;
  const renderContent = () =>
    !isOpen ? null : <ImportImage sendAction={sendImportAction} importData={importData} />;

  return (
    <BottomSheet
      isOpen={isOpen}
      initialSnap={1}
      useViewInsteadOfScrollview
      renderContent={renderContent}
      renderHeader={renderHeader}
      style={styles.container}
      {...props}
    />
  );
};
