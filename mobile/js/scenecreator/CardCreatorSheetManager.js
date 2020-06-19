import * as React from 'react';
import { View } from 'react-native';
import { useGhostUI } from '../ghost/GhostUI';

import ActiveToolSheet from './ActiveToolSheet';
import BlueprintsSheet from './BlueprintsSheet';
import CardToolsSheet from './CardToolsSheet';
import CreateCardSettingsSheet from './CreateCardSettingsSheet';
import InspectorSheet from './InspectorSheet';

import Viewport from '../viewport';

import { CARD_HEADER_HEIGHT } from '../CardHeader';
const FULL_SHEET_HEIGHT = 100 * Viewport.vh - CARD_HEADER_HEIGHT;

// some sheets are provided by Ghost ToolUI elements.
// these are marked with `isGhostPane: true`.
// TODO: convert remaining sheets to data panes with React UI.
const SHEETS = [
  {
    key: 'sceneCreatorBlueprints',
    isGhostPane: true,
    Component: BlueprintsSheet,
  },
  {
    key: 'sceneCreatorTool',
    isGhostPane: true,
    Component: ActiveToolSheet,
  },
  {
    key: 'sceneCreatorInspector',
    isGhostPane: true,
    Component: InspectorSheet,
  },
  {
    key: 'variables',
    Component: CardToolsSheet,
    snapPoints: [FULL_SHEET_HEIGHT],
  },
  {
    key: 'layout',
    Component: CreateCardSettingsSheet,
    snapPoints: [FULL_SHEET_HEIGHT * 0.6],
  },
];

export const CardCreatorSheetManager = ({
  context,
  isPlaying,
  hasSelection,
  activeSheet,
  setActiveSheet,
}) => {
  const { root, transformAssetUri } = useGhostUI();

  context = {
    ...context,
    transformAssetUri,
  };

  const onCloseSheet = () => setActiveSheet(null);
  return (
    <React.Fragment>
      {SHEETS.map((sheet, ii) => {
        const { key, Component, isGhostPane } = sheet;
        let isOpen = false;

        // all sheets are closed when playing
        if (!isPlaying) {
          if (activeSheet) {
            isOpen = key === activeSheet;
          } else {
            // if no sheets are open, but an actor is selected, fall back to inspector
            isOpen = hasSelection && key === 'sceneCreatorInspector';
          }
        }

        const sheetProps = {
          context,
          isOpen,
          onClose: onCloseSheet,
        };
        if (isGhostPane) {
          const element = root?.panes ? root.panes[key] : null;
          if (element) {
            return <Component key={key} element={root.panes[key]} {...sheetProps} />;
          }
        } else {
          const { snapPoints } = sheet;
          return <Component key={key} snapPoints={snapPoints} {...sheetProps} />;
        }
        return null;
      })}
    </React.Fragment>
  );
};
