import React, { useState, useRef, useEffect } from 'react';
import { PixelRatio, StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
import { CastleAsyncStorage } from '../common/CastleAsyncStorage';
import { GameLoading } from './GameLoading';
import { GameView } from './GameView';
import { sendAsync } from '../core/CoreEvents';
import * as Constants from '../Constants';
import * as CoreViews from '../CoreViews';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    backgroundColor: 'black',
    left: 0,
    bottom: 0,
    width: '100%',
    borderRadius: Constants.CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
});

export const CardScene = ({
  deck,

  // whether to init the engine with a blank scene
  isNewScene,

  // if provided, engine uses this instead of performing a network request for the deck/card/variables
  initialSnapshotJson,

  style,
  interactionEnabled = true,
  isEditable = false,
  isViewSource = false,
  onMessage,
  paused = false,
  beltHeight,
  beltHeightFraction,
}) => {
  const [reloadCount, setReloadCount] = useState(0);
  const onPressReload = async () => {
    await new Promise((resolve) => setTimeout(resolve, 40));
    setReloadCount(reloadCount + 1);
  };

  const [loaded, setLoaded] = useState(false);
  const onLoaded = React.useCallback(async () => {
    setLoaded(true);
    const isMutedStorageValue = await CastleAsyncStorage.getItem('IS_MUTED');
    const isMuted = isMutedStorageValue === 'true' || isMutedStorageValue === true;
    sendAsync('SET_SOUND_ENABLED', { enabled: isMuted && !isEditable ? false : true });
  }, [isEditable]);

  const [shouldDisplay, setShouldDisplay] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShouldDisplay(true);
    }, 50);
    return () => clearTimeout(timeout);
  }, [deck?.deckId]);

  const [initialParams, setInitialParams] = useState('');
  useEffect(() => {
    setInitialParams(
      JSON.stringify({
        deckId: deck?.deckId,
        initialCardId: deck?.initialCard?.cardId,
        initialCardSceneDataUrl: deck?.initialCard?.sceneDataUrl,
        initialSnapshotJson,
        pixelRatio: PixelRatio.get(),
        isEditable,
        isViewSource,
        isDebug: !!__DEV__,
        isNewScene,
        textOverlayStyle: Constants.CORE_OVERLAY_TEXT_STYLE,
      })
    );
  }, [isEditable, deck?.deckId, isNewScene, initialSnapshotJson]);

  CoreViews.useCoreViews();

  return (
    <View style={style}>
      {deck?.deckId ? (
        <React.Fragment>
          {shouldDisplay && (
            <GameView
              key={`game-view-${deck.deckId}-${reloadCount}`}
              initialParams={initialParams}
              beltHeightFraction={beltHeightFraction}
              onMessage={onMessage}
              onLoaded={onLoaded}
              paused={paused}
              coreViews={CoreViews.getCoreViews()}
            />
          )}
          {!interactionEnabled ? (
            <TouchableWithoutFeedback style={styles.overlay}>
              <View style={[styles.overlay, { opacity: 0 }]} />
            </TouchableWithoutFeedback>
          ) : null}
        </React.Fragment>
      ) : null}
      {!loaded ? (
        <GameLoading
          loadingImage={deck?.initialCard?.backgroundImage}
          isEditable={isEditable}
          beltHeight={beltHeight}
        />
      ) : null}
    </View>
  );
};
