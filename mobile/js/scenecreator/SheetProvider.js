import * as React from 'react';
import { NewBlueprintSheet } from './sheets/NewBlueprintSheet';
import { CapturePreviewSheet } from './sheets/CapturePreviewSheet';
import { CardToolsSheet } from './sheets/CardToolsSheet';
import { CreateCardSettingsSheet } from './sheets/CreateCardSettingsSheet';
import { DrawingImportImageSheet } from './sheets/DrawingImportImageSheet';
import { DrawingLayersSheet } from './sheets/DrawingLayersSheet';
import { InspectorSheet } from './inspector/InspectorSheet';
import { InstanceSheet } from './inspector/instance/InstanceSheet';
import { TextContentSheet } from './inspector/instance/TextContentSheet';
import { SheetBackgroundOverlay } from '../components/SheetBackgroundOverlay';
import { useCardCreator } from './CreateCardContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Viewport from '../common/viewport';

import { CARD_HEADER_HEIGHT } from './CreateCardHeader';
const FULL_SHEET_HEIGHT = 100 * Viewport.vh - CARD_HEADER_HEIGHT;

const ROOT_SHEETS = [
  {
    key: 'sceneCreatorNewBlueprint',
    Component: NewBlueprintSheet,
    makeSnapPoints: ({ insets }) => [FULL_SHEET_HEIGHT * 0.75, FULL_SHEET_HEIGHT - insets.top - 16],
  },
  {
    key: 'sceneCreatorInstance',
    Component: InstanceSheet,
  },
  {
    key: 'sceneCreatorTextContent',
    Component: TextContentSheet,
  },
  {
    key: 'sceneCreatorInspector',
    Component: InspectorSheet,
  },
  {
    key: 'variables',
    Component: CardToolsSheet,
    makeSnapPoints: ({ insets }) => [FULL_SHEET_HEIGHT * 0.65, FULL_SHEET_HEIGHT - insets.top - 16],
  },
  {
    key: 'sceneCreatorSettings',
    Component: CreateCardSettingsSheet,
    snapPoints: [FULL_SHEET_HEIGHT * 0.6],
  },
  {
    key: 'capturePreview',
    Component: CapturePreviewSheet,
    makeSnapPoints: ({ insets }) => [FULL_SHEET_HEIGHT - insets.top - 16],
  },
  {
    key: 'drawingLayers',
    Component: DrawingLayersSheet,
    makeSnapPoints: ({ insets }) => [90, 300, Viewport.vh * 100 - insets.top - 100],
  },
  {
    key: 'drawingImportImage',
    Component: DrawingImportImageSheet,
    makeSnapPoints: ({ insets }) => [48 + insets.bottom, 256, 450 + insets.bottom],
    initialSnap: 1,
  },
];

// root sheets can have a stack of child sheets
const sheetStackReducer = (prevStacks, action) => {
  let result = { ...prevStacks };
  switch (action.type) {
    case 'push': {
      const { key, sheet } = action;
      if (!result[key]) {
        result[key] = [ROOT_SHEETS.find((sheet) => sheet.key === key)];
      }
      result[key] = result[key].concat([sheet]);
      break;
    }
    case 'pop': {
      const { key } = action;
      if (!result[key] || result[key].length < 2) {
        throw new Error(`Tried to pop root sheet or nonexistent sheet`);
      }
      // TODO: animate out
      result[key] = result[key].slice(0, -1);
      break;
    }
    default:
      throw new Error(`Unrecognized sheet stack action: ${action.type}`);
  }
  return result;
};

export const SheetProvider = ({ activeSheet, setActiveSheet, editMode, beltHeight }) => {
  const { isPlaying } = useCardCreator();
  const insets = useSafeAreaInsets();

  const [sheetStacks, updateSheetStacks] = React.useReducer(sheetStackReducer, {});
  const closeRootSheet = () => setActiveSheet({ default: null });

  return (
    <React.Fragment>
      {ROOT_SHEETS.map((sheet, ii) => {
        const { key } = sheet;
        let isOpen = false;

        // all sheets are closed when playing
        if (!isPlaying) {
          if (activeSheet[editMode]) {
            isOpen = key === activeSheet[editMode];
          }
        }

        const stack = sheetStacks[key] ?? [sheet];
        const addChildSheet = (sheet) => updateSheetStacks({ type: 'push', key, sheet });
        const closeChildSheet = () => updateSheetStacks({ type: 'pop', key });

        return stack.map((sheet, stackIndex) => {
          let { key, Component, ...sheetProps } = sheet;

          const closeLastSheet = stackIndex == 0 ? closeRootSheet : closeChildSheet;
          const maybeOverlay =
            stackIndex == 0 || isPlaying || !isOpen ? null : (
              <SheetBackgroundOverlay onPress={closeLastSheet} />
            );

          sheetProps = {
            ...sheetProps,
            isOpen,
            addChildSheet,
            onClose: closeLastSheet,
            snapPoints: sheetProps.makeSnapPoints
              ? sheetProps.makeSnapPoints({ insets })
              : sheetProps.snapPoints,
            beltHeight,
          };

          return (
            <React.Fragment key={key}>
              {maybeOverlay}
              <Component {...sheetProps} />
            </React.Fragment>
          );
        });
      })}
    </React.Fragment>
  );
};
