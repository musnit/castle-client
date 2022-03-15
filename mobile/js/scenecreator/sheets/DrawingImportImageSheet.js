import React from 'react';
import { ActivityIndicator, StyleSheet, Pressable, View } from 'react-native';
import { AppText as Text } from '../../components/AppText';
import { BottomSheet } from '../../components/BottomSheet';
import { BottomSheetHeader } from '../../components/BottomSheetHeader';
import { InspectorNumberInput } from '../inspector/components/InspectorNumberInput';
import { InspectorSegmentedControl } from '../inspector/components/InspectorSegmentedControl';
import { useCoreState, sendAsync } from '../../core/CoreEvents';

import * as Constants from '../../Constants';
import * as SceneCreatorConstants from '../SceneCreatorConstants';

import ColorPicker from '../inspector/components/ColorPicker';
import Feather from 'react-native-vector-icons/Feather';
import tinycolor from 'tinycolor2';

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
    marginBottom: 8,
  },
  label: {
    width: '50%',
    fontSize: 16,
    paddingBottom: 8,
  },
  errorLabel: {
    fontSize: 16,
  },
  paletteRefresh: {
    ...SceneCreatorConstants.styles.button,
    borderRadius: 8,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paletteSwatch: {
    ...SceneCreatorConstants.styles.button,
    borderRadius: 8,
    paddingHorizontal: 4,
    marginRight: 12,
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
          <Text style={testStyles.label}>Normalize?</Text>
        </View>
        <InspectorNumberInput
          style={{ maxWidth: '40%' }}
          onChange={(value) => sendAction('setNormalizeRgb', { value })}
          value={importData.normalizeRgb === true ? 1 : 0}
          min={0}
          max={1}
        />
      </View>
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

const NUM_COLOR_ITEMS = [
  {
    name: '2',
    value: 2,
  },
  {
    name: '3',
    value: 3,
  },
  {
    name: '4',
    value: 4,
  },
  {
    name: '5',
    value: 5,
  },
];

const PALETTE_ITEMS = [
  {
    name: 'Similar Brightness',
    value: 1,
  },
  {
    name: 'Random Palette',
    value: 0,
  },
];

const intColorToRgbaArray = (intColor) => {
  return [
    ((intColor >> 16) & 0xff) / 255.0,
    ((intColor >> 8) & 0xff) / 255.0,
    ((intColor >> 0) & 0xff) / 255.0,
    1.0,
  ];
};

const rgbaArrayToIntColor = (rgba) => {
  return (
    (((rgba[0] * 255.0) & 0xff) << 16) +
    (((rgba[1] * 255.0) & 0xff) << 8) +
    ((rgba[2] * 255.0) & 0xff)
  );
};

const ImportImage = ({ importData, sendAction }) => {
  const [selectedPaletteType, setSelectedPaletteType] = React.useState(1);
  const swapColors = React.useCallback(
    () => sendAction('swapColors', { value: selectedPaletteType }),
    [selectedPaletteType]
  );
  const selectedColorIndex = NUM_COLOR_ITEMS.findIndex(
    (item) => item.value === importData.numColors
  );
  const onChangeNumColors = React.useCallback(
    (index) => sendAction('setNumColors', { value: NUM_COLOR_ITEMS[index].value }),
    []
  );
  const selectedPaletteIndex = PALETTE_ITEMS.findIndex(
    (item) => item.value === selectedPaletteType
  );
  const onChangePaletteIndex = React.useCallback(
    (index) => {
      const newPaletteType = PALETTE_ITEMS[index].value;
      setSelectedPaletteType(newPaletteType);
      sendAction('swapColors', { value: newPaletteType });
    },
    [setSelectedPaletteType]
  );

  // based on the palette colors used and the overrides, compute which colors to show
  let finalColors = [...importData.paletteColorsUsed];
  Object.entries(importData.paletteOverrides).map(([fromColor, toColor]) => {
    let index = finalColors.indexOf(parseInt(fromColor, 10));
    if (index != -1) {
      finalColors[index] = toColor;
    }
  });

  const overrideColor = React.useCallback(
    (rgba, index) => {
      sendAction('overrideColor', {
        valuePair: [importData.paletteColorsUsed[index], rgbaArrayToIntColor(rgba)],
      });
    },
    [importData.paletteColorsUsed]
  );

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
        <Text style={styles.label}>Maximum Colors</Text>
        <InspectorSegmentedControl
          style={{ flex: 1 }}
          items={NUM_COLOR_ITEMS}
          selectedItemIndex={selectedColorIndex}
          onChange={onChangeNumColors}
        />
      </View>
      <View style={styles.row}>
        <InspectorSegmentedControl
          style={{ flex: 1 }}
          items={PALETTE_ITEMS}
          selectedItemIndex={selectedPaletteIndex}
          onChange={onChangePaletteIndex}
        />
      </View>
      <View style={[styles.row, { justifyContent: 'flex-start' }]}>
        <Pressable style={styles.paletteRefresh} onPress={swapColors}>
          <Feather name="refresh-cw" size={20} />
        </Pressable>
        {finalColors.map((intColor, ii) => {
          const rgba = intColorToRgbaArray(intColor);
          return (
            <View style={styles.paletteSwatch} key={`color-swatch-${ii}`}>
              <ColorPicker value={rgba} setValue={(rgba) => overrideColor(rgba, ii)} />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const ImportImageError = () => (
  <View style={styles.importSettings}>
    <Text style={styles.errorLabel}>
      Castle couldn't import the image you chose. Try picking a different image.
    </Text>
  </View>
);

export const DrawingImportImageSheet = ({ isOpen, ...props }) => {
  const importData = useCoreState('EDITOR_IMPORT_IMAGE') || { status: 'none' };
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
      onDone={importData.status === 'importing' ? confirmImport : null}
      loading={importData?.loading}
    />
  );
  let Component;
  if (importData.status === 'error') {
    Component = ImportImageError;
  } else {
    Component = USE_TEST_UI ? TestImportImage : ImportImage;
  }
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
