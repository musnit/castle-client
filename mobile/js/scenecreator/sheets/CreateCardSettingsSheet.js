import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InspectorCheckbox } from '../inspector/components/InspectorCheckbox';
import { InspectorNumberInput } from '../inspector/components/InspectorNumberInput';
import { useCardCreator } from '../CreateCardContext';
import { useCoreState, sendAsync } from '../../core/CoreEvents';

import { BottomSheet } from '../../components/BottomSheet';
import { BottomSheetHeader } from '../../components/BottomSheetHeader';

import ColorPicker from '../inspector/components/ColorPicker';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  colorPicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingsRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    padding: 16,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingBottom: 16,
  },
  numberInput: {
    width: '50%',
  },
  numberLabel: {
    fontSize: 16,
  },
});

const ToggleWithValue = ({
  enabled,
  value,
  onChangeEnabled,
  onChangeValue,
  toggleLabel,
  valueLabel,
  valueProps,
}) => {
  return (
    <View style={{ paddingBottom: 16 }}>
      <InspectorCheckbox
        label={toggleLabel}
        value={enabled}
        onChange={onChangeEnabled}
        style={{ paddingBottom: 16 }}
      />
      {enabled ? (
        <View style={styles.numberRow}>
          <Text style={styles.numberLabel}>{valueLabel}</Text>
          <View style={styles.numberInput}>
            <InspectorNumberInput value={value} onChange={onChangeValue} {...valueProps} />
          </View>
        </View>
      ) : null}
    </View>
  );
};

export const CreateCardSettings = () => {
  const { isShowingTextActors, setShowingTextActors } = useCardCreator();

  const settingsData = useCoreState('EDITOR_SCENE_SETTINGS');
  const sendAction = (...args) => sendAsync('EDITOR_CHANGE_SCENE_SETTINGS', ...args);

  if (!settingsData) return null;

  return (
    <View>
      <View style={styles.settingsRow}>
        <View style={styles.colorPicker}>
          <Text style={styles.numberLabel}>Card background color</Text>
          <ColorPicker
            value={settingsData.sceneProperties.backgroundColor}
            setValue={(color) =>
              sendAction({ type: 'scene', action: 'setBackgroundColor', colorValue: color })
            }
          />
        </View>
      </View>
      <View style={styles.settingsRow}>
        <InspectorCheckbox
          label="Show text actors"
          value={isShowingTextActors}
          onChange={setShowingTextActors}
        />
      </View>
      <View style={styles.settingsRow}>
        {settingsData.grabToolProperties ? (
          <ToggleWithValue
            toggleLabel="Layout grid snap"
            valueLabel="Grid size"
            enabled={settingsData.grabToolProperties.gridEnabled}
            value={settingsData.grabToolProperties.gridSize}
            onChangeEnabled={(value) =>
              sendAction({ type: 'grab', action: 'setGridEnabled', doubleValue: value ? 1 : 0 })
            }
            onChangeValue={(value) =>
              sendAction({ type: 'grab', action: 'setGridSize', doubleValue: value })
            }
            valueProps={{ min: 0, step: 0.5 }}
          />
        ) : null}
        {settingsData.scaleRotateProperties ? (
          <>
            <ToggleWithValue
              toggleLabel="Resize grid snap"
              valueLabel="Grid size"
              enabled={settingsData.scaleGridEnabled}
              value={settingsData.scaleGridSize}
              onChangeEnabled={(value) => sendAction('setScaleGridEnabled', value)}
              onChangeValue={(value) => sendAction('setScaleGridSize', value)}
              valueProps={{ min: 0, step: 0.5 }}
            />
            <ToggleWithValue
              toggleLabel="Rotation snap"
              valueLabel="Increment"
              enabled={settingsData.rotateIncrementEnabled}
              value={settingsData.rotateIncrementDegrees}
              onChangeEnabled={(value) => sendAction('setRotateIncrementEnabled', value)}
              onChangeValue={(value) => sendAction('setRotateIncrementDegrees', value)}
              valueProps={{ min: 0, step: 5 }}
            />
          </>
        ) : null}
      </View>
    </View>
  );
};

export const CreateCardSettingsSheet = ({ isOpen, onClose, ...props }) => {
  const { isShowingTextActors, setShowingTextActors } = useCardCreator();

  const renderHeader = () => <BottomSheetHeader title="Layout" onClose={onClose} />;
  const renderContent = () =>
    !isOpen ? null : (
      <CreateCardSettings
        isShowingTextActors={isShowingTextActors}
        setShowingTextActors={setShowingTextActors}
      />
    );

  return (
    <BottomSheet
      isOpen={isOpen}
      renderContent={renderContent}
      renderHeader={renderHeader}
      style={styles.container}
      {...props}
    />
  );
};
