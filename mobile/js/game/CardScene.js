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
    aspectRatio: Constants.CARD_RATIO,
    borderRadius: Constants.CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
});

export const CardScene = ({
  card,
  style,
  interactionEnabled = true,
  initialIsEditing = false,
  isEditable = false,
  onMessage,
  deckState,
  paused = false,
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
  }, [card?.cardId]);

  return (
    <View style={style}>
      {card?.scene && card.cardId ? (
        <React.Fragment>
          {shouldDisplay && (
            <GameView
              key={`game-view-${card.cardId}-${reloadCount}`}
              extras={{
                initialParams: JSON.stringify({
                  scene: {
                    sceneId: card.scene.sceneId,
                    data: card.scene.data,
                    deckState,
                  },
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
              deckState={deckState}
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
      {!loaded ? <GameLoading loadingImage={card?.backgroundImage} /> : null}
    </View>
  );
};
