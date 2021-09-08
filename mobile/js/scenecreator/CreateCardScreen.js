import React from 'react';
import { Keyboard, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { isTablet } from 'react-native-device-info';

import * as Constants from '../Constants';
import * as LibraryEntryClipboard from './LibraryEntryClipboard';
import * as Utilities from '../common/utilities';

import Viewport from '../common/viewport';

import * as GhostEvents from '../ghost/GhostEvents';
import { useListen, useCoreState, sendGlobalAction, sendAsync } from '../core/CoreEvents';

import { CardScene } from '../game/CardScene';
import { CardSceneLoading } from './CardSceneLoading';
import { CardText } from '../components/CardText';
import { CreateCardContext } from './CreateCardContext';
import { CreateCardHeader, CARD_HEADER_HEIGHT } from './CreateCardHeader';
import { CreateCardOverlay } from './overlay/CreateCardOverlay';

import { PopoverProvider } from '../components/PopoverProvider';
import { SheetProvider } from './SheetProvider';

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
  scene: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  textActorsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  textActorsAspectRatio: {
    aspectRatio: Constants.CARD_RATIO,
    width: '100%',
    height: '100%',
    maxWidth: 100 * Viewport.vw,
    maxHeight: (100 * Viewport.vw) / Constants.CARD_RATIO,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
});

// TODO: consolidate with PlayDeck
const useCoreTextActors = () => {
  const [textActors, setTextActors] = React.useState([]);
  useListen({
    eventName: 'TEXT_ACTORS_DATA',
    handler: ({ data }) => {
      const { textActors } = JSON.parse(data);
      setTextActors(textActors);
    },
  });
  return textActors;
};

export const CreateCardScreen = ({
  card,
  deck,
  isNewScene = false,
  initialIsEditing = true,
  initialSnapshotJson = null,
  loading,
  goToDeck,
  goToCard,
  cardNeedsSave,
  saveAndGoToDeck,
  saveAndGoToCard,
  onSceneMessage,
  onSceneRevertData,
  saveAction = 'none',
}) => {
  const { showActionSheetWithOptions } = useActionSheet();

  const [activeSheet, setActiveSheet] = React.useState(null);
  React.useEffect(Keyboard.dismiss, [activeSheet]);

  const [isShowingTextActors, setShowingTextActors] = React.useState(true);

  const globalActions = useCoreState('EDITOR_GLOBAL_ACTIONS');

  const isSceneLoaded = !!globalActions;
  const isPlaying =
    globalActions?.performing === undefined ? !initialIsEditing : globalActions.performing;
  const { selectedActorId, isTextActorSelected, isBlueprintSelected, isInspectorOpen } =
    globalActions || {};
  const hasSelection = selectedActorId >= 0 && activeSheet !== 'capturePreview';
  const textActors = useCoreTextActors();
  const editMode = globalActions?.editMode;

  React.useEffect(() => {
    // when changing between selected or unselected, close sheets
    setActiveSheet(null);
  }, [hasSelection]);

  React.useEffect(() => {
    if (isInspectorOpen) {
      setActiveSheet('sceneCreatorInspector');
    }
  }, [isInspectorOpen, setActiveSheet]);

  React.useEffect(() => {
    if (isSceneLoaded) {
      // sync once on load, in case we already have something in JS clipboard
      LibraryEntryClipboard.sync();

      // request static data from engine
      sendAsync('EDITOR_JS_LOADED', {});
    }
  }, [isSceneLoaded]);

  const selectActor = React.useCallback((actorId) => {
    sendAsync('SELECT_ACTOR', {
      actorId,
    });
  }, []);

  // never select text actor instance, just skip straight to blueprint
  const selectTextActor = React.useCallback(
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
  }, [cardNeedsSave, saveAndGoToDeck, goToDeck]);

  const maybeSaveAndGoToCard = React.useCallback(
    async (nextCard) => {
      if (!Utilities.canGoToCard(nextCard, isPlaying)) {
        return;
      }
      if (!cardNeedsSave() || saveAction === 'none') {
        // no changes, or unable to save
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
    [deck, cardNeedsSave, saveAndGoToCard, goToCard, isPlaying]
  );

  const onSelectBackupData = React.useCallback(
    (data) => {
      setActiveSheet(null);
      onSceneRevertData(data);
    },
    [onSceneRevertData, setActiveSheet]
  );

  // TODO: Wire up to new engine
  GhostEvents.useListen({
    eventName: 'NAVIGATE_TO_CARD',
    handler: ({ card }) => maybeSaveAndGoToCard(card),
  });

  useListen({
    eventName: 'CAPTURE_PENDING',
    handler: async () => {
      await sendGlobalAction('onRewind');
      setActiveSheet('capturePreview');
    },
  });

  useListen({
    eventName: 'SHOW_NEW_BLUEPRINT_SHEET',
    handler: () => {
      setActiveSheet('sceneCreatorNewBlueprint');
    },
  });

  if (Constants.Android) {
    // after the game loads, it listens for keyboard events and
    // causes react native's back button event to fail
    // TODO: Wire up to new engine
    GhostEvents.useListen({
      eventName: 'CASTLE_SYSTEM_BACK_BUTTON',
      handler: maybeSaveAndGoToDeck,
    });
  }

  const cardBackgroundStyles = {
    backgroundColor: card.backgroundImage ? '#000' : '#f2f2f2',
    justifyContent: isTextActorSelected ? 'flex-start' : 'flex-end',
  };

  const insets = useSafeAreaInsets();
  const headerHeight = CARD_HEADER_HEIGHT;
  const maxCardHeight = 100 * Viewport.vh - headerHeight - insets.top - insets.bottom;
  let beltHeight = maxCardHeight - (Viewport.vw * 100) / Constants.CARD_RATIO;
  beltHeight = Math.floor(Math.min(Math.max(MIN_BELT_HEIGHT, beltHeight), MAX_BELT_HEIGHT));
  const beltHeightFraction = beltHeight / maxCardHeight;
  const cardFitStyles = { width: '100%', height: maxCardHeight };

  const isCardTextVisible =
    (isShowingTextActors || isPlaying) &&
    editMode === 'default' &&
    !(hasSelection && !isInspectorOpen) && // TODO: how to select text blueprint?
    textActors &&
    Object.keys(textActors).length;

  const contextValue = {
    deck,
    card,
    isSceneLoaded,
    isPlaying,
    selectedActorId,
    hasSelection,
    isTextActorSelected,
    isBlueprintSelected,
    library: null, // TODO: library
    onSelectBackupData,
    isShowingTextActors,
    setShowingTextActors,
    saveAction,
  };

  return (
    <CreateCardContext.Provider value={contextValue}>
      <PopoverProvider>
        <View
          style={[
            Constants.styles.container,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}>
          <CreateCardHeader
            card={card}
            isEditable
            mode={activeSheet}
            onChangeMode={setActiveSheet}
            onPressBack={maybeSaveAndGoToDeck}
            onSave={saveAndGoToDeck}
            creatorUsername={deck?.creator?.username}
            saveAction={saveAction}
          />
          <View style={styles.cardBody}>
            <View style={[styles.card, cardBackgroundStyles, cardFitStyles]}>
              <CardScene
                key={`card-scene-${card?.cardId}`}
                deck={deck}
                initialSnapshotJson={initialSnapshotJson}
                interactionEnabled={true}
                style={styles.scene}
                isNewScene={isNewScene}
                isEditable={true}
                initialIsEditing={initialIsEditing}
                onMessage={onSceneMessage}
                beltHeight={beltHeight}
                beltHeightFraction={beltHeightFraction}
              />
              {isCardTextVisible ? (
                <View
                  style={[styles.textActorsContainer, { marginBottom: beltHeight }]}
                  pointerEvents="box-none">
                  <View
                    pointerEvents="box-none"
                    style={[
                      styles.textActorsAspectRatio,
                      { justifyContent: isTextActorSelected ? 'flex-start' : 'flex-end' },
                    ]}>
                    <CardText
                      disabled={loading}
                      visible={isCardTextVisible}
                      textActors={textActors}
                      card={card}
                      onSelect={selectTextActor}
                      isEditable={!isPlaying}
                    />
                  </View>
                </View>
              ) : null}
              <CreateCardOverlay
                activeSheet={activeSheet}
                setActiveSheet={setActiveSheet}
                editMode={editMode}
                beltHeight={beltHeight}
              />
              {isSceneLoaded ? null : <CardSceneLoading />}
            </View>
          </View>
        </View>
        <SheetProvider
          activeSheet={activeSheet}
          setActiveSheet={setActiveSheet}
          editMode={editMode}
          beltHeight={beltHeight}
        />
      </PopoverProvider>
    </CreateCardContext.Provider>
  );
};
