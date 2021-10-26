import React, { useState, useRef, useEffect } from 'react';
import { PixelRatio, StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
import { GameLoading } from './GameLoading';
import { GameView } from './GameView';
import * as Constants from '../Constants';

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
  const onLoaded = React.useCallback(() => {
    setLoaded(true);
  }, []);

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
        deckVariables: JSON.stringify({
          variables: deck?.variables || [],
        }),
        initialCardId: deck?.initialCard?.cardId,
        initialCardSceneDataUrl: deck?.initialCard?.sceneDataUrl,
        initialSnapshotJson,
        pixelRatio: PixelRatio.get(),
        isEditable,
        isDebug: !!__DEV__,
        isNewScene,
      })
    );
  }, [isEditable, deck?.deckId, isNewScene, initialSnapshotJson]);

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
