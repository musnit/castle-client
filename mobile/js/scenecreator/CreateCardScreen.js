import React from 'react';
import { Keyboard, View, StyleSheet } from 'react-native';
import { markEditorCrashStatusRead } from '../Session';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { isTablet } from 'react-native-device-info';

import * as Constants from '../Constants';
import * as Utilities from '../common/utilities';

import Viewport from '../common/viewport';

import { useListen, useCoreState, sendGlobalAction, sendAsync } from '../core/CoreEvents';

import { CardScene } from '../game/CardScene';
import { CardSceneLoading } from './CardSceneLoading';
import { CommandsOverlay } from './overlay/CommandsOverlay';
import { CreateCardContext } from './CreateCardContext';
import { CreateCardHeader, CARD_HEADER_HEIGHT } from './CreateCardHeader';
import { CreateCardOverlay } from './overlay/CreateCardOverlay';

import { PopoverProvider } from '../components/PopoverProvider';
import { SheetProvider } from './SheetProvider';
import { useAppState } from '../ghost/GhostAppState';
import { useGameViewAndroidBackHandler } from '../common/GameViewAndroidBackHandler';

const TABLET_BELT_HEIGHT_MULTIPLIER = isTablet() ? 2 : 1;
const MIN_BELT_HEIGHT = 1.2 * TABLET_BELT_HEIGHT_MULTIPLIER * 48;
const MAX_BELT_HEIGHT = 1.2 * TABLET_BELT_HEIGHT_MULTIPLIER * 60;

const styles = StyleSheet.create({
  cardBody: {
    // contains just the card as a child
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    overflow: 'hidden',
  },
  cardPlayBase: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    backgroundColor: 'red',
    overflow: 'hidden',
  },
  cardPlayAspectRatio: {
    maxHeight: (100 * Viewport.vw) / Constants.CARD_RATIO,
    aspectRatio: Constants.CARD_RATIO,
    borderRadius: Constants.CARD_BORDER_RADIUS,
  },
  scene: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});

export const CreateCardScreen = ({
  deck,
  cardId,
  isNewScene = false,
  isViewSource = false,
  initialSnapshotJson = null,
  loading,
  goToDeck,
  goToCard,
  cardNeedsSave,
  isCardChanged,
  saveDeck,
  saveAndGoToDeck,
  saveAndGoToCard,
  onSceneMessage,
  onVariablesChange,
  onSceneRevertData,
  saveAction = 'none',
}) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const [appState, setAppState] = React.useState('active');
  useAppState(setAppState);

  // load editor -> stop showing unsaved work banner
  React.useEffect(markEditorCrashStatusRead, []);

  // activeSheet maps from `editMode` to sheet key
  const [activeSheet, setActiveSheet] = React.useReducer(
    (state, action) => ({
      ...state,
      ...action,
    }),
    { default: null, draw: 'drawingLayers', sound: null }
  );
  React.useEffect(Keyboard.dismiss, [activeSheet.default]);

  const globalActions = useCoreState('EDITOR_GLOBAL_ACTIONS');

  const isSceneLoaded = !!globalActions;
  const isPlaying = globalActions?.performing === undefined ? false : globalActions.performing;
  const { selectedActorId, isTextActorSelected, isBlueprintSelected, isInspectorOpen } =
    globalActions || {};
  const hasSelection = selectedActorId >= 0 && activeSheet.default !== 'capturePreview';
  const editMode = globalActions?.editMode;

  React.useEffect(() => {
    if (isInspectorOpen && !activeSheet.default) {
      setActiveSheet({ default: 'sceneCreatorInspector' });
    } else if (!isInspectorOpen && activeSheet.default === 'sceneCreatorInspector') {
      setActiveSheet({ default: null });
    }
  }, [isInspectorOpen, activeSheet.default, setActiveSheet]);

  React.useEffect(() => {
    if (
      hasSelection &&
      globalActions?.defaultModeCurrentTool === 'scaleRotate' &&
      activeSheet.default !== 'sceneCreatorInstance'
    ) {
      setActiveSheet({ default: 'sceneCreatorInstance' });
    } else if (
      activeSheet.default === 'sceneCreatorInstance' &&
      (!hasSelection || globalActions?.defaultModeCurrentTool !== 'scaleRotate')
    ) {
      // if we exited scale-rotate tool via deselection or changing selection or changing tool,
      // close corresponding layout sheet
      setActiveSheet({ default: null });
    }
  }, [activeSheet.default, setActiveSheet, hasSelection, globalActions?.defaultModeCurrentTool]);

  React.useEffect(() => {
    if (isSceneLoaded) {
      // request static data from engine
      sendAsync('EDITOR_JS_LOADED', {});
    }
  }, [isSceneLoaded]);

  // used for text - never select text actor instance, just skip straight to blueprint
  const selectBlueprint = React.useCallback(
    (actorId) => sendAsync('SELECT_BLUEPRINT', { actorId }),
    []
  );

  const maybeSaveAndGoToDeck = React.useCallback(async () => {
    // don't prompt on back button unless the card has changes and
    // we're in the card creator
    if (cardNeedsSave() && saveAction === 'save') {
      showActionSheetWithOptions(
        {
          title: 'Save changes?',
          options: ['Save', 'Discard', 'Cancel'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            return saveAndGoToDeck();
          } else if (buttonIndex === 1) {
            return goToDeck();
          }
        }
      );
    } else {
      return goToDeck();
    }
  }, [cardNeedsSave, saveAndGoToDeck, goToDeck, saveAction, showActionSheetWithOptions]);

  const maybeSaveAndGoToCard = React.useCallback(
    async (nextCard) => {
      if (!Utilities.canGoToCard(nextCard, isPlaying)) {
        return;
      }
      if (isPlaying || !cardNeedsSave() || saveAction === 'none') {
        // playing, or no changes, or unable to save
        return goToCard(nextCard, isPlaying);
      } else {
        const title = Utilities.makeCardPreviewTitle(nextCard, deck);
        if (saveAction === 'save') {
          showActionSheetWithOptions(
            {
              title: `Save changes and go to '${title}'?`,
              options: ['Save and go', 'Cancel'],
              cancelButtonIndex: 1,
            },
            (buttonIndex) => {
              if (buttonIndex === 0) {
                return saveAndGoToCard(nextCard, isPlaying);
              }
            }
          );
        } else {
          // can't clone and go to card, so prompt to discard before leaving
          showActionSheetWithOptions(
            {
              title: `Discard changes and go to '${title}'?`,
              options: ['Discard and go', 'Cancel'],
              cancelButtonIndex: 1,
            },
            (buttonIndex) => {
              if (buttonIndex === 0) {
                return goToCard(nextCard, isPlaying);
              }
            }
          );
        }
      }
    },
    [
      deck,
      cardNeedsSave,
      saveAndGoToCard,
      goToCard,
      isPlaying,
      saveAction,
      showActionSheetWithOptions,
    ]
  );

  const onHardwareBackPress = React.useCallback(() => {
    if (activeSheet.default) {
      setActiveSheet({ default: null });
    } else {
      maybeSaveAndGoToDeck();
    }

    return true;
  }, [activeSheet.default, setActiveSheet, maybeSaveAndGoToDeck]);
  useGameViewAndroidBackHandler({ onHardwareBackPress });

  const onSelectBackupData = React.useCallback(
    (data) => {
      setActiveSheet({ default: null });
      onSceneRevertData(data);
    },
    [onSceneRevertData, setActiveSheet]
  );

  useListen({
    eventName: 'NAVIGATE_TO_CARD',
    handler: (card) => maybeSaveAndGoToCard(card),
  });

  useListen({
    eventName: 'CAPTURE_PENDING',
    handler: async () => {
      await sendGlobalAction('onRewind');
      setActiveSheet({ default: 'capturePreview' });
    },
  });

  useListen({
    eventName: 'SHOW_NEW_BLUEPRINT_SHEET',

    // c++ also clears the current selection when sending this event.
    // wait for the selection to clear and close any inspector/overlay before showing the new sheet
    handler: () => setTimeout(() => setActiveSheet({ default: 'sceneCreatorNewBlueprint' }), 0.125),
  });

  const onPressSettings = React.useCallback(
    () => setActiveSheet({ default: 'variables' }),
    [setActiveSheet]
  );

  useListen({
    eventName: 'EDITOR_VARIABLES',
    handler: (data) => {
      if (data.variables) {
        // map bridge format to save format
        onVariablesChange(
          data.variables.map((variable) => ({
            ...variable,
            id: variable.variableId,
            variableId: undefined,
          })),
          data.isChanged
        );
      } else {
        onVariablesChange(data.variables, data.isChanged);
      }
    },
  });

  const cardBackgroundStyles = {
    backgroundColor: isPlaying ? 'black' : '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const insets = useSafeAreaInsets();
  const headerHeight = CARD_HEADER_HEIGHT;
  const maxCardHeight = 100 * Viewport.vh - headerHeight - insets.top - insets.bottom;
  let beltHeight = maxCardHeight - (Viewport.vw * 100) / Constants.CARD_RATIO;
  beltHeight = Math.floor(Math.min(Math.max(MIN_BELT_HEIGHT, beltHeight), MAX_BELT_HEIGHT));
  const beltHeightFraction = beltHeight / maxCardHeight;
  const cardFitStyles = { width: '100%', height: maxCardHeight };

  const contextValue = {
    deck,
    cardId,
    editMode,
    isSceneLoaded,
    isPlaying,
    selectedActorId,
    hasSelection,
    isTextActorSelected,
    isBlueprintSelected,
    onSelectBackupData,
    saveAction,
  };

  return (
    <CreateCardContext.Provider value={contextValue}>
      <PopoverProvider>
        <View
          style={{
            flex: 1,
            backgroundColor: '#fff',
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}>
          <CreateCardHeader
            isEditable
            onPressSettings={onPressSettings}
            onPressBack={maybeSaveAndGoToDeck}
            isCardChanged={isCardChanged}
            onSaveAndGoToDeck={saveAndGoToDeck}
            loading={loading}
            onSave={saveDeck}
            creatorUsername={deck?.creator?.username}
            saveAction={saveAction}
          />
          <View style={styles.cardBody}>
            <View style={[styles.card, cardBackgroundStyles, cardFitStyles]}>
              <View style={[styles.cardPlayBase, isPlaying ? styles.cardPlayAspectRatio : null]}>
                <CardScene
                  key={`card-scene-${cardId}`}
                  deck={deck}
                  initialSnapshotJson={initialSnapshotJson}
                  interactionEnabled={true}
                  style={styles.scene}
                  isNewScene={isNewScene}
                  isViewSource={isViewSource}
                  isEditable={true}
                  paused={appState !== 'active'}
                  onMessage={onSceneMessage}
                  beltHeight={beltHeight}
                  beltHeightFraction={beltHeightFraction}
                />
              </View>
              <CreateCardOverlay
                activeSheet={activeSheet}
                setActiveSheet={setActiveSheet}
                editMode={editMode}
                beltHeight={beltHeight}
              />
              <CommandsOverlay visible={!isPlaying} />
              {isSceneLoaded ? null : <CardSceneLoading />}
            </View>
          </View>
          <SheetProvider
            activeSheet={activeSheet}
            setActiveSheet={setActiveSheet}
            editMode={editMode}
            beltHeight={beltHeight}
          />
        </View>
      </PopoverProvider>
    </CreateCardContext.Provider>
  );
};
