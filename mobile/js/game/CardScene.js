import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
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
  style,
  interactionEnabled = true,
  initialIsEditing = false,
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

  const [logsVisible, setLogsVisible] = useState(false);

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

  return (
    <View style={style}>
      {deck?.deckId ? (
        <React.Fragment>
          {shouldDisplay && (
            <GameView
              key={`game-view-${deck.deckId}-${reloadCount}`}
              deckId={deck.deckId}
              extras={{
                initialParams: JSON.stringify({
                  isEditing: initialIsEditing,
                  isEditable,
                  isDebug: !!__DEV__,
                  beltHeightFraction,
                }),
              }}
              isEditable={isEditable}
              headerVisible={false}
              onPressReload={onPressReload}
              logsVisible={initialIsEditing && logsVisible}
              setLogsVisible={setLogsVisible}
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
