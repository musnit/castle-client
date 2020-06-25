import * as React from 'react';
import { Animated, TouchableWithoutFeedback, View } from 'react-native';
import { useGhostUI } from '../ghost/GhostUI';

import ActiveToolSheet from './ActiveToolSheet';
import BlueprintsSheet from './BlueprintsSheet';
import CardToolsSheet from './CardToolsSheet';
import CreateCardSettingsSheet from './CreateCardSettingsSheet';
import InspectorSheet from './InspectorSheet';

import Viewport from '../viewport';

import { CARD_HEADER_HEIGHT } from '../CardHeader';
const FULL_SHEET_HEIGHT = 100 * Viewport.vh - CARD_HEADER_HEIGHT;

const ROOT_SHEETS = [
  {
    key: 'sceneCreatorLegacyBlueprints',
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

const SheetBackgroundOverlay = ({ onPress }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(opacity, { toValue: 0.75, duration: 250, useNativeDriver: true }).start();
  }, []);
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          opacity,
        }}
      />
    </TouchableWithoutFeedback>
  );
};

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

  const [sheetStacks, updateSheetStacks] = React.useReducer(sheetStackReducer, {});
  const closeRootSheet = () => setActiveSheet(null);

  return (
    <React.Fragment>
      {ROOT_SHEETS.map((sheet, ii) => {
        const { key } = sheet;
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

        const stack = sheetStacks[key] ?? [sheet];
        const addChildSheet = (sheet) => updateSheetStacks({ type: 'push', key, sheet });
        const closeChildSheet = () => updateSheetStacks({ type: 'pop', key });

        return stack.map((sheet, stackIndex) => {
          let { key, Component, ...sheetProps } = sheet;
          const closeLastSheet = stackIndex == 0 ? closeRootSheet : closeChildSheet;
          const maybeOverlay =
            stackIndex == 0 ? null : <SheetBackgroundOverlay onPress={closeLastSheet} />;

          // some sheets are provided by Ghost ToolUI elements.
          const ghostPaneElement = root?.panes ? root.panes[key] : null;

          sheetProps = {
            ...sheetProps,
            context,
            isOpen,
            addChildSheet,
            onClose: closeLastSheet,
            element: ghostPaneElement,
          };

          return (
            <React.Fragment>
              {maybeOverlay}
              <Component key={key} {...sheetProps} />
            </React.Fragment>
          );
        });
      })}
    </React.Fragment>
  );
};
