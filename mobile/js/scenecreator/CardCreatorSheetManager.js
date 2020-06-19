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

const SHEETS = [
  {
    key: 'sceneCreatorBlueprints',
    Component: BlueprintsSheet,
  },
  {
    key: 'sceneCreatorTool',
    Component: ActiveToolSheet,
  },
  {
    key: 'sceneCreatorInspector',
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
        const { key, Component, snapPoints } = sheet;
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

        // some sheets are provided by Ghost ToolUI elements.
        const ghostPaneElement = root?.panes ? root.panes[key] : null;

        const sheetProps = {
          context,
          isOpen,
          snapPoints,
          onClose: onCloseSheet,
          element: ghostPaneElement,
        };

        return <Component key={key} {...sheetProps} />;
      })}
    </React.Fragment>
  );
};
